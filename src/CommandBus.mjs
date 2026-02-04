import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'

/**
 * CommandBus provides deterministic command handling for Hubot with safe-by-default behavior.
 * 
 * Logging Strategy:
 * - Event logging to disk is disabled by default
 * - To enable: pass `disableLogging: false` in constructor options
 * - When enabled, events are written asynchronously (fire-and-forget) to avoid blocking
 * - Writes happen individually as events occur
 */
export class CommandBus extends EventEmitter {
  constructor(robot, options = {}) {
    super()
    this.robot = robot
    this.commands = new Map()
    this.pendingProposals = new Map()
    this.typeResolvers = new Map()
    this.prefix = options.prefix ?? ''
    this.proposalTTL = options.proposalTTL || 300000 // 5 minutes default
    this.logPath = options.logPath || path.join(process.cwd(), '.data', 'commands-events.ndjson')
    this.disableLogging = options.disableLogging ?? true
    this.permissionProvider = options.permissionProvider || null
  }

  register(spec, opts = {}) {
    if (!spec.id) {
      throw new Error('Command spec must have an id')
    }
    if (!spec.handler || typeof spec.handler !== 'function') {
      throw new Error('Command spec must have a handler function')
    }

    const aliases = this._normalizeAliases(spec.aliases)

    const existing = this.commands.get(spec.id)
    if (existing && !opts.update) {
      throw new Error(`Command ${spec.id} is already registered`)
    }

    const command = {
      id: spec.id,
      description: spec.description || '',
      aliases: aliases.original,
      normalizedAliases: aliases.normalized,
      examples: spec.examples || [],
      args: spec.args || {},
      sideEffects: spec.sideEffects || [],
      confirm: spec.confirm || 'if_ambiguous',
      permissions: spec.permissions || {},
      handler: spec.handler
    }

    this.commands.set(spec.id, command)
    const eventPayload = { commandId: spec.id, aliases: command.normalizedAliases, timestamp: Date.now() }
    if (existing && opts.update) {
      this.emit('commands:updated', eventPayload)
      this._log({ event: 'commands:updated', ...eventPayload })
    } else {
      this.emit('commands:registered', eventPayload)
      this._log({ event: 'commands:registered', ...eventPayload })
    }

    const collisions = this.aliasCollisions()
    if (Object.keys(collisions).length > 0) {
      this.emit('commands:alias_collision_detected', { collisions, timestamp: Date.now() })
      this._log({ event: 'commands:alias_collision_detected', collisions, timestamp: Date.now() })
    }

    return command
  }

  /**
   * Register a custom type resolver for argument validation.
   * Resolvers are called during validation and can transform/validate values.
   * 
   * @param {string} typeName - The type name to register (e.g., 'project_id')
   * @param {Function} resolver - Async function(value, schema, context) that returns validated value or throws
   * @throws {Error} If typeName is empty or resolver is not a function
   * @public
   * 
   * @example
   * robot.commands.registerTypeResolver('project_id', async (value, schema, context) => {
   *   if (!value.startsWith('PRJ-')) throw new Error('must start with PRJ-')
   *   return value.toUpperCase()
   * })
   */
  registerTypeResolver(typeName, resolver) {
    if (typeof typeName !== 'string' || !typeName) {
      throw new Error('Type name must be a non-empty string')
    }
    if (typeof resolver !== 'function') {
      throw new Error('Resolver must be a function')
    }
    this.typeResolvers.set(typeName, resolver)
  }

  unregister(commandId) {
    return this.commands.delete(commandId)
  }

  getCommand(commandId) {
    return this.commands.get(commandId)
  }

  listCommands(filter = {}) {
    let commands = Array.from(this.commands.values())

    if (filter.prefix) {
      commands = commands.filter(c => c.id.startsWith(filter.prefix))
    }

    return commands
  }

  aliasCollisions() {
    const collisions = {}
    const aliasMap = new Map()

    for (const command of this.commands.values()) {
      for (const alias of command.normalizedAliases || []) {
        if (!aliasMap.has(alias)) {
          aliasMap.set(alias, [])
        }
        aliasMap.get(alias).push(command.id)
      }
    }

    for (const [alias, ids] of aliasMap.entries()) {
      if (ids.length > 1) {
        collisions[alias] = ids
      }
    }

    return collisions
  }

  search(query, opts = {}) {
    if (!query || typeof query !== 'string') {
      return []
    }

    const normalizedQuery = this._normalizeAlias(query)
    const queryTokens = this._tokenizeQuery(normalizedQuery)
    const results = []

    for (const command of this.commands.values()) {
      const aliasMatches = this._scoreAliases(command, normalizedQuery, queryTokens)
      const descriptionMatches = this._scoreText(command.description, queryTokens)
      const exampleMatches = this._scoreExamples(command.examples, queryTokens)

      const bestAliasScore = aliasMatches.score
      const bestDescScore = descriptionMatches.score
      const bestExampleScore = exampleMatches.score

      const bestScore = Math.max(bestAliasScore, bestDescScore, bestExampleScore)
      if (bestScore === 0) {
        continue
      }

      let matchedOn = 'description'
      if (bestAliasScore >= bestDescScore && bestAliasScore >= bestExampleScore) {
        matchedOn = 'alias'
      } else if (bestExampleScore >= bestDescScore) {
        matchedOn = 'example'
      }

      results.push({
        id: command.id,
        score: bestScore,
        matchedOn
      })
    }

    results.sort((a, b) => b.score - a.score)
    return results
  }

  getHelp(commandId) {
    const command = this.getCommand(commandId)
    if (!command) {
      return null
    }

    let help = `Command: ${command.id}\n`
    help += `Description: ${command.description}\n`
    help += `Usage: ${this.prefix}${command.id} [options]\n`

    if (command.aliases.length > 0) {
      help += `Intent: ${command.aliases.join(', ')}\n`
    }

    if (Object.keys(command.args).length > 0) {
      help += '\nArguments:\n'
      for (const [name, schema] of Object.entries(command.args)) {
        const required = schema.required ? ' (required)' : ''
        const defaultVal = schema.default !== undefined ? ` [default: ${schema.default}]` : ''
        const values = schema.values ? ` [values: ${schema.values.join(', ')}]` : ''
        help += `  --${name} (${schema.type})${required}${defaultVal}${values}\n`
      }
    }

    if (command.examples.length > 0) {
      help += '\nExamples:\n'
      command.examples.forEach(ex => {
        help += `  ${ex}\n`
      })
    }

    return help
  }

  parse(text) {

    if (!text || typeof text !== 'string') {
      return null
    }

    // Strip prefix if present (optional)
    const withoutPrefix = text.startsWith(this.prefix) 
      ? text.slice(this.prefix.length).trim()
      : text.trim()

    const parts = this._tokenize(withoutPrefix)
    if (parts.length === 0) {
      return null
    }

    const commandId = parts[0]
    if (!this.commands.has(commandId)) {
      return null
    }

    const command = this.commands.get(commandId)
    const args = {}

    for (let i = 1; i < parts.length; i++) {
      const token = parts[i]

      // Handle -- key value pattern
      if (token === '--') {
        const key = parts[i + 1]
        const valueToken = parts[i + 2]
        if (key && valueToken && !valueToken.startsWith('--') && !valueToken.includes(':')) {
          args[key] = valueToken
          i += 2
        } else if (key) {
          args[key] = true
          i += 1
        }
        continue
      }

      // Handle --key value or --key "quoted value"
      if (token.startsWith('--')) {
        const key = token.slice(2)
        const nextToken = parts[i + 1]
        const schema = command.args[key]

        // Use schema hint: boolean type = flag, others expect value
        if (schema && schema.type === 'boolean') {
          args[key] = true
        } else if (nextToken && !nextToken.startsWith('--') && !nextToken.includes(':')) {
          args[key] = nextToken
          i++ // Skip next token
        } else {
          // No schema or ambiguous: default to boolean flag
          args[key] = true
        }
      }
      // Handle key:value or key:"quoted value"
      else if (token.includes(':')) {
        const colonIndex = token.indexOf(':')
        const key = token.slice(0, colonIndex)
        const value = token.slice(colonIndex + 1)
        args[key] = value
      }
    }

    const parsed = {
      commandId,
      args,
      rawText: text
    }

    this.emit('commands:invocation_parsed', { commandId, args, timestamp: Date.now() })
    this._log({ event: 'commands:invocation_parsed', commandId, args, timestamp: Date.now() })

    return parsed
  }

  _tokenize(text) {
    const tokens = []
    let current = ''
    let inQuotes = false
    let quoteChar = null
    let escapeNext = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]

      if (escapeNext) {
        current += char
        escapeNext = false
        continue
      }

      if (inQuotes && char === '\\') {
        escapeNext = true
        continue
      }

      if ((char === '"' || char === '\'') && !inQuotes) {
        inQuotes = true
        quoteChar = char
        continue
      }

      if (char === quoteChar && inQuotes) {
        inQuotes = false
        quoteChar = null
        continue
      }

      if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current)
          current = ''
        }
        continue
      }

      current += char
    }

    if (current) {
      tokens.push(current)
    }

    return tokens
  }

  _normalizeAliases(aliases) {
    if (aliases === undefined || aliases === null) {
      return { original: [], normalized: [] }
    }
    if (!Array.isArray(aliases)) {
      throw new Error('Command aliases must be an array of strings')
    }

    const original = []
    const normalized = []
    const seen = new Set()

    for (const alias of aliases) {
      if (typeof alias !== 'string') {
        throw new Error('Command aliases must be an array of strings')
      }
      const trimmed = alias.trim()
      if (!trimmed) {
        throw new Error('Command aliases must be non-empty strings')
      }

      const normalizedAlias = this._normalizeAlias(trimmed)
      if (seen.has(normalizedAlias)) {
        continue
      }

      seen.add(normalizedAlias)
      original.push(trimmed)
      normalized.push(normalizedAlias)
    }

    return { original, normalized }
  }

  _normalizeAlias(alias) {
    return alias.trim().replace(/\s+/g, ' ').toLowerCase()
  }

  _tokenizeQuery(text) {
    return text.split(/\s+/).filter(Boolean)
  }

  _scoreAliases(command, normalizedQuery, queryTokens) {
    const aliases = command.normalizedAliases || []
    if (aliases.length === 0) {
      return { score: 0 }
    }

    if (aliases.includes(normalizedQuery)) {
      return { score: 100 }
    }

    const bestOverlap = aliases.reduce((best, alias) => {
      const tokens = this._tokenizeQuery(alias)
      const overlap = queryTokens.filter(t => tokens.includes(t)).length
      return Math.max(best, overlap)
    }, 0)

    return { score: bestOverlap * 10 }
  }

  _scoreText(text, queryTokens) {
    if (!text) {
      return { score: 0 }
    }

    const tokens = this._tokenizeQuery(this._normalizeAlias(text))
    const overlap = queryTokens.filter(t => tokens.includes(t)).length
    return { score: overlap * 5 }
  }

  _scoreExamples(examples, queryTokens) {
    if (!examples || examples.length === 0) {
      return { score: 0 }
    }

    const bestOverlap = examples.reduce((best, example) => {
      const tokens = this._tokenizeQuery(this._normalizeAlias(example))
      const overlap = queryTokens.filter(t => tokens.includes(t)).length
      return Math.max(best, overlap)
    }, 0)

    return { score: bestOverlap * 5 }
  }

  async validate(commandId, rawArgs, context) {
    const command = this.getCommand(commandId)
    if (!command) {
      return {
        ok: false,
        errors: [`Command ${commandId} not found`],
        missing: []
      }
    }

    const args = { ...rawArgs }
    const errors = []
    const missing = []

    // Apply defaults and validate each arg
    for (const [name, schema] of Object.entries(command.args)) {
      const value = args[name]

      // Check required
      if (schema.required && (value === undefined || value === null)) {
        missing.push(name)
        continue
      }

      // Apply default
      if (value === undefined && schema.default !== undefined) {
        args[name] = schema.default
        continue
      }

      // Skip validation if not provided and not required
      if (value === undefined) {
        continue
      }

      // Type validation and conversion
      try {
        args[name] = await this._validateType(name, value, schema, context)
      } catch (err) {
        errors.push(err.message)
      }
    }

    if (missing.length > 0 || errors.length > 0) {
      const result = {
        ok: false,
        errors,
        missing,
        args
      }

      this.emit('commands:validation_failed', { commandId, errors, missing, timestamp: Date.now() })
      this._log({ event: 'commands:validation_failed', commandId, errors, missing, timestamp: Date.now() })

      return result
    }

    return {
      ok: true,
      args
    }
  }

  async _validateType(name, value, schema, context) {
    // Check custom type resolvers first
    if (this.typeResolvers.has(schema.type)) {
      const resolver = this.typeResolvers.get(schema.type)
      try {
        return await resolver(value, schema, context)
      } catch (err) {
        throw new Error(`Argument ${name}: ${err.message}`)
      }
    }

    // Built-in types
    switch (schema.type) {
      case 'string':
        return String(value)

      case 'number': {
        const num = Number(value)
        if (isNaN(num)) {
          throw new Error(`Argument ${name} must be a number`)
        }
        return num
      }

      case 'boolean': {
        return coerceToBoolean(value)
      }

      case 'enum': {
        if (!Array.isArray(schema.values) || schema.values.length === 0) {
          throw new Error(`Argument ${name}: enum values must be a non-empty array`)
        }
        if (!schema.values.includes(value)) {
          throw new Error(`Argument ${name} must be one of: ${schema.values.join(', ')}`)
        }
        return value
      }

      case 'user': {
        const users = this.robot.brain.users()
        const user = Object.values(users).find(u => u.name === value || u.id === value)
        if (!user) {
          throw new Error(`Argument ${name}: user "${value}" not found`)
        }
        return user
      }

      case 'room': {
        if (!value.startsWith('#')) {
          throw new Error(`Argument ${name}: room must start with #`)
        }
        return value
      }

      case 'date': {
        let date

        if (value === 'today') {
          date = new Date()
          date.setHours(0, 0, 0, 0)
        } else if (value === 'tomorrow') {
          date = new Date()
          date.setDate(date.getDate() + 1)
          date.setHours(0, 0, 0, 0)
        } else {
          date = new Date(value)
        }

        if (isNaN(date.getTime())) {
          throw new Error(`Argument ${name}: invalid date "${value}"`)
        }

        return date
      }

      default:
        return value
    }
  }

  needsConfirmation(commandId) {
    const command = this.getCommand(commandId)
    if (!command) {
      return false
    }

    if (command.confirm === 'always') {
      return true
    }

    if (command.confirm === 'never') {
      return false
    }

    // Default: confirm if has side effects
    return command.sideEffects.length > 0
  }

  async propose(proposal, context) {
    const { commandId, args } = proposal
    const command = this.getCommand(commandId)

    if (!command) {
      throw new Error(`Command ${commandId} not found`)
    }

    const confirmationKey = this._getConfirmationKey(context.user.id, context.room)
    const preview = this._renderPreview(commandId, args)

    const pendingProposal = {
      commandId,
      args,
      context,
      preview,
      confirmationKey,
      timestamp: Date.now(),
      timeoutId: null
    }

    this.pendingProposals.set(confirmationKey, pendingProposal)

    // Set TTL timeout
    pendingProposal.timeoutId = setTimeout(() => {
      this.pendingProposals.delete(confirmationKey)
    }, this.proposalTTL)

    this.emit('commands:proposal_created', { commandId, confirmationKey, timestamp: Date.now() })
    this.emit('commands:proposal_confirm_requested', { commandId, confirmationKey, timestamp: Date.now() })
    this._log({ event: 'commands:proposal_created', commandId, confirmationKey, timestamp: Date.now() })
    this._log({ event: 'commands:proposal_confirm_requested', commandId, confirmationKey, timestamp: Date.now() })

    return pendingProposal
  }

  async confirm(replyText, context) {
    const confirmationKey = this._getConfirmationKey(context.user.id, context.room)
    const pending = this.pendingProposals.get(confirmationKey)

    if (!pending) {
      return null
    }

    const normalizedReply = replyText.toLowerCase().trim()

    if (normalizedReply === 'yes' || normalizedReply === 'y') {
      clearTimeout(pending.timeoutId)
      this.pendingProposals.delete(confirmationKey)

      this.emit('commands:proposal_confirmed', {
        commandId: pending.commandId,
        confirmationKey,
        timestamp: Date.now()
      })
      this._log({
        event: 'commands:proposal_confirmed',
        commandId: pending.commandId,
        confirmationKey,
        timestamp: Date.now()
      })

      const result = await this.execute(pending.commandId, pending.args, pending.context)

      return {
        executed: true,
        result
      }
    }

    if (normalizedReply === 'no' || normalizedReply === 'n' || normalizedReply === 'cancel') {
      clearTimeout(pending.timeoutId)
      this.pendingProposals.delete(confirmationKey)

      this.emit('commands:proposal_cancelled', {
        commandId: pending.commandId,
        confirmationKey,
        timestamp: Date.now()
      })
      this._log({
        event: 'commands:proposal_cancelled',
        commandId: pending.commandId,
        confirmationKey,
        timestamp: Date.now()
      })

      return {
        cancelled: true
      }
    }

    return null
  }

  async execute(commandId, args, context) {
    const command = this.getCommand(commandId)
    if (!command) {
      throw new Error(`Command ${commandId} not found`)
    }

    // Check permissions
    if (command.permissions.rooms && command.permissions.rooms.length > 0) {
      if (!command.permissions.rooms.includes(context.room)) {
        this.emit('commands:permission_denied', {
          commandId,
          room: context.room,
          timestamp: Date.now()
        })
        this._log({
          event: 'commands:permission_denied',
          commandId,
          room: context.room,
          timestamp: Date.now()
        })
        throw new Error('Permission denied: command not allowed in this room')
      }
    }

    if (command.permissions.roles && command.permissions.roles.length > 0) {
      if (this.permissionProvider && typeof this.permissionProvider.hasRole === 'function') {
        const allowed = await this.permissionProvider.hasRole(context.user, command.permissions.roles, context)
        if (!allowed) {
          this.emit('commands:permission_denied', {
            commandId,
            roles: command.permissions.roles,
            timestamp: Date.now()
          })
          this._log({
            event: 'commands:permission_denied',
            commandId,
            roles: command.permissions.roles,
            timestamp: Date.now()
          })
          throw new Error('Permission denied: insufficient role')
        }
      }
    }

    try {
      const result = await command.handler({ args, context })

      this.emit('commands:executed', { commandId, timestamp: Date.now() })
      this._log({ event: 'commands:executed', commandId, timestamp: Date.now() })

      return result
    } catch (err) {
      this.emit('commands:error', { commandId, error: err.message, timestamp: Date.now() })
      this._log({ event: 'commands:error', commandId, error: err.message, timestamp: Date.now() })
      throw err
    }
  }

  async invoke(text, context) {
    const parsed = this.parse(text)
    if (!parsed) {
      return null
    }

    const helpRequested = parsed.args && (parsed.args.help === true || parsed.args.h === true)
    if (helpRequested) {
      const helpText = this.getHelp(parsed.commandId)
      return {
        ok: true,
        helpOnly: true,
        result: helpText
      }
    }

    const validation = await this.validate(parsed.commandId, parsed.args, context)

    if (!validation.ok) {
      return validation
    }

    // Check if needs confirmation
    if (this.needsConfirmation(parsed.commandId)) {
      const proposal = await this.propose({
        commandId: parsed.commandId,
        args: validation.args
      }, context)

      return {
        needsConfirmation: true,
        proposal
      }
    }

    const result = await this.execute(parsed.commandId, validation.args, context)

    return {
      ok: true,
      result
    }
  }

  _getConfirmationKey(userId, room) {
    return `${userId}:${room}`
  }

  _renderPreview(commandId, args) {
    let preview = `${this.prefix}${commandId}`

    for (const [key, value] of Object.entries(args)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
      const needsQuotes = valueStr.includes(' ') || valueStr.includes('"')
      const escapedValue = needsQuotes
        ? valueStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        : valueStr
      preview += ` --${key} ${needsQuotes ? `"${escapedValue}"` : escapedValue}`
    }

    return preview
  }

  /**
   * Clear all pending proposal timers and proposals.
   * Call this during shutdown or in test teardown to prevent timers from keeping the process alive.
   * 
   * @public
   */
  clearPendingProposals() {
    for (const proposal of this.pendingProposals.values()) {
      if (proposal.timeoutId) {
        clearTimeout(proposal.timeoutId)
      }
    }
    this.pendingProposals.clear()
  }

  _log(event) {
    if (this.disableLogging) {
      return
    }

    // Fire and forget - write asynchronously without blocking
    this._writeLog(event).catch(() => {})
  }

  async _writeLog(event) {
    try {
      const logDir = path.dirname(this.logPath)
      await fs.promises.mkdir(logDir, { recursive: true })
      const line = JSON.stringify(event) + '\n'
      await fs.promises.appendFile(this.logPath, line, 'utf8')
    } catch (err) {
      // Silent fail for logging errors
    }
  }
}

function coerceToBoolean(value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', 't', 'yes', 'y', '1', 'on'].includes(normalized)) {
      return true
    }
    if (['false', 'f', 'no', 'n', '0', 'off'].includes(normalized)) {
      return false
    }
  }

  return Boolean(value)
}
