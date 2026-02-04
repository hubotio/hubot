import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { CommandBus } from '../src/CommandBus.mjs'

// Fake robot for testing
class FakeRobot {
  constructor() {
    this.brain = {
      users: () => ({
        '1': { id: '1', name: 'alice' },
        '2': { id: '2', name: 'bob' },
        '3': { id: '3', name: 'charlie' }
      })
    }
  }
}

describe('CommandBus', () => {
  let commandBus
  let robot
  let logPath

  beforeEach(() => {
    robot = new FakeRobot()
    logPath = path.join(process.cwd(), `test-commands-${Date.now()}.ndjson`)
    commandBus = new CommandBus(robot, { logPath, disableLogging: true })
  })

  afterEach(async () => {
    commandBus.clearPendingProposals()
    try {
      await fs.promises.unlink(logPath)
    } catch (err) {
    }
  })

  describe('register()', () => {
    it('should register a command with minimal spec', () => {
      const spec = {
        id: 'test.hello',
        description: 'Say hello',
        handler: async (ctx) => 'Hello!'
      }

      commandBus.register(spec)
      const cmd = commandBus.getCommand('test.hello')

      assert.strictEqual(cmd.id, 'test.hello')
      assert.strictEqual(cmd.description, 'Say hello')
    })

    it('should throw error when registering duplicate command id', () => {
      const spec = {
        id: 'test.duplicate',
        description: 'Test',
        handler: async () => {}
      }

      commandBus.register(spec)
      assert.throws(() => {
        commandBus.register(spec)
      }, /already registered/)
    })

    it('should allow updating a command', () => {
      const spec1 = {
        id: 'test.update',
        description: 'First version',
        handler: async () => 'v1'
      }
      const spec2 = {
        id: 'test.update',
        description: 'Second version',
        handler: async () => 'v2'
      }

      commandBus.register(spec1)
      commandBus.register(spec2, { update: true })

      const cmd = commandBus.getCommand('test.update')
      assert.strictEqual(cmd.description, 'Second version')
    })

    it('should allow unregistering a command', () => {
      const spec = {
        id: 'test.remove',
        description: 'Will be removed',
        handler: async () => {}
      }

      commandBus.register(spec)
      assert.ok(commandBus.getCommand('test.remove'))

      commandBus.unregister('test.remove')
      assert.strictEqual(commandBus.getCommand('test.remove'), undefined)
    })
  })

  describe('parse()', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'tickets.create',
        description: 'Create a ticket',
        handler: async () => {}
      })
      commandBus.register({
        id: 'deploy.run',
        description: 'Deploy',
        handler: async () => {}
      })
    })

    it('should parse command with quoted string arguments', () => {
      const result = commandBus.parse('tickets.create --title "VPN down" --priority high')

      assert.ok(result)
      assert.strictEqual(result.commandId, 'tickets.create')
      assert.strictEqual(result.args.title, 'VPN down')
      assert.strictEqual(result.args.priority, 'high')
    })

    it('should parse backslash-escaped quotes inside quoted strings', () => {
      const result = commandBus.parse('tickets.create --message "She said \\\"hello\\\""')

      assert.ok(result)
      assert.strictEqual(result.commandId, 'tickets.create')
      assert.strictEqual(result.args.message, 'She said "hello"')
    })

    it('should parse command with key:value arguments', () => {
      const result = commandBus.parse('tickets.create title:"VPN down" priority:high')

      assert.ok(result)
      assert.strictEqual(result.commandId, 'tickets.create')
      assert.strictEqual(result.args.title, 'VPN down')
      assert.strictEqual(result.args.priority, 'high')
    })

    it('should parse boolean flags', () => {
      const result = commandBus.parse('deploy.run --dry-run --force')

      assert.ok(result)
      assert.strictEqual(result.commandId, 'deploy.run')
      assert.strictEqual(result.args['dry-run'], true)
      assert.strictEqual(result.args.force, true)
    })

    it('should return null for messages not starting with prefix', () => {
      const result = commandBus.parse('just a normal chat message')
      assert.strictEqual(result, null)
    })

    it('should handle mixed argument styles', () => {
      const result = commandBus.parse('tickets.create --title "VPN down" priority:high --assignee matt')

      assert.ok(result)
      assert.strictEqual(result.args.title, 'VPN down')
      assert.strictEqual(result.args.priority, 'high')
      assert.strictEqual(result.args.assignee, 'matt')
    })

    it('should return null for unknown command or alias', () => {
      const result = commandBus.parse('unknown.command --arg value')
      assert.strictEqual(result, null)
    })

    it('should use schema hints to disambiguate boolean flags', () => {
      commandBus.register({
        id: 'test.schema',
        description: 'Test schema-aware parsing',
        args: {
          force: { type: 'boolean' },
          count: { type: 'number' }
        },
        handler: async () => {}
      })

      const result = commandBus.parse('test.schema --force --count 5')

      assert.ok(result)
      assert.strictEqual(result.args.force, true)
      assert.strictEqual(result.args.count, '5')
    })
  })

  describe('aliases', () => {
    it('should normalize aliases and enforce uniqueness', () => {
      commandBus.register({
        id: 'test.aliases',
        description: 'Test aliases',
        aliases: ['  New  Ticket  ', 'new ticket', 'NEW   TICKET', 'create ticket'],
        handler: async () => {}
      })

      const cmd = commandBus.getCommand('test.aliases')
      assert.deepStrictEqual(cmd.aliases, ['New  Ticket', 'create ticket'])
      assert.deepStrictEqual(cmd.normalizedAliases, ['new ticket', 'create ticket'])
    })

    it('should reject invalid aliases', () => {
      assert.throws(() => {
        commandBus.register({
          id: 'test.aliases.invalid',
          description: 'Invalid aliases',
          aliases: ['  ', 123],
          handler: async () => {}
        })
      }, /aliases/)
    })

    it('should not execute or propose for alias invocation', async () => {
      let executed = false
      commandBus.register({
        id: 'test.alias.invoke',
        description: 'Alias should not invoke',
        aliases: ['alias.invoke'],
        sideEffects: ['side effect'],
        handler: async () => {
          executed = true
          return 'done'
        }
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      const result = await commandBus.invoke('alias.invoke --arg value', context)
      assert.strictEqual(result, null)
      assert.strictEqual(executed, false)
    })
  })

  describe('validate()', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'test.validate',
        description: 'Test validation',
        args: {
          title: { type: 'string', required: true },
          priority: { type: 'enum', values: ['low', 'medium', 'high'], default: 'medium' },
          count: { type: 'number', required: false },
          active: { type: 'boolean', default: false }
        },
        handler: async () => {}
      })
    })

    it('should apply defaults from schema', async () => {
      const result = await commandBus.validate('test.validate', { title: 'Test' }, {})

      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.args.title, 'Test')
      assert.strictEqual(result.args.priority, 'medium')
      assert.strictEqual(result.args.active, false)
    })

    it('should reject missing required args', async () => {
      const result = await commandBus.validate('test.validate', {}, {})

      assert.strictEqual(result.ok, false)
      assert.ok(result.missing.includes('title'))
    })

    it('should reject invalid enum values', async () => {
      const result = await commandBus.validate('test.validate', { title: 'Test', priority: 'critical' }, {})

      assert.strictEqual(result.ok, false)
      assert.ok(result.errors.some(e => e.includes('priority')))
    })

    it('should validate and convert number type', async () => {
      const result = await commandBus.validate('test.validate', { title: 'Test', count: '42' }, {})

      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.args.count, 42)
    })

    it('should validate boolean type', async () => {
      const result = await commandBus.validate('test.validate', { title: 'Test', active: 'true' }, {})

      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.args.active, true)
    })
  })

  describe('user resolver', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'test.user',
        description: 'Test user resolution',
        args: {
          assignee: { type: 'user', required: true }
        },
        handler: async () => {}
      })
    })

    it('should resolve user by name to brain user record', async () => {
      const result = await commandBus.validate('test.user', { assignee: 'alice' }, {})

      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.args.assignee.id, '1')
      assert.strictEqual(result.args.assignee.name, 'alice')
    })

    it('should fail validation if user not found', async () => {
      const result = await commandBus.validate('test.user', { assignee: 'nonexistent' }, {})

      assert.strictEqual(result.ok, false)
      assert.ok(result.errors.some(e => e.includes('assignee')))
    })
  })

  describe('room resolver', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'test.room',
        description: 'Test room validation',
        args: {
          channel: { type: 'room', required: true }
        },
        handler: async () => {}
      })
    })

    it('should validate room format', async () => {
      const result = await commandBus.validate('test.room', { channel: '#ops' }, {})

      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.args.channel, '#ops')
    })

    it('should reject invalid room format', async () => {
      const result = await commandBus.validate('test.room', { channel: 'ops' }, {})

      assert.strictEqual(result.ok, false)
      assert.ok(result.errors.some(e => e.includes('channel')))
    })

    it('should allow custom room resolver override', async () => {
      commandBus.registerTypeResolver('room', async (value) => {
        if (!value.startsWith('room:')) {
          throw new Error('room must start with room:')
        }
        return value
      })

      const result = await commandBus.validate('test.room', { channel: 'room:ops' }, {})

      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.args.channel, 'room:ops')
    })
  })

  describe('date resolver', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'test.date',
        description: 'Test date parsing',
        args: {
          due: { type: 'date', required: true }
        },
        handler: async () => {}
      })
    })

    it('should parse "today" keyword', async () => {
      const result = await commandBus.validate('test.date', { due: 'today' }, {})

      assert.strictEqual(result.ok, true)
      assert.ok(result.args.due instanceof Date)
    })

    it('should parse "tomorrow" keyword', async () => {
      const result = await commandBus.validate('test.date', { due: 'tomorrow' }, {})

      assert.strictEqual(result.ok, true)
      assert.ok(result.args.due instanceof Date)
    })

    it('should parse ISO date string', async () => {
      const result = await commandBus.validate('test.date', { due: '2026-02-15' }, {})

      assert.strictEqual(result.ok, true)
      assert.ok(result.args.due instanceof Date)
    })

    it('should reject invalid date', async () => {
      const result = await commandBus.validate('test.date', { due: 'invalid-date' }, {})

      assert.strictEqual(result.ok, false)
      assert.ok(result.errors.some(e => e.includes('due')))
    })
  })

  describe('custom type resolvers', () => {
    it('should allow registering custom type resolver', async () => {
      commandBus.registerTypeResolver('project_id', async (value) => {
        if (!value.startsWith('PRJ-')) {
          throw new Error('must start with PRJ-')
        }
        return value.toUpperCase()
      })

      commandBus.register({
        id: 'test.custom',
        description: 'Test custom type',
        args: {
          project: { type: 'project_id', required: true }
        },
        handler: async () => {}
      })

      const result = await commandBus.validate('test.custom', { project: 'PRJ-123' }, {})
      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.args.project, 'PRJ-123')
    })

    it('should reject invalid custom type values', async () => {
      commandBus.registerTypeResolver('project_id', async (value) => {
        if (!value.startsWith('PRJ-')) {
          throw new Error('must start with PRJ-')
        }
        return value.toUpperCase()
      })

      commandBus.register({
        id: 'test.custom.invalid',
        description: 'Test custom type validation',
        args: {
          project: { type: 'project_id', required: true }
        },
        handler: async () => {}
      })

      const result = await commandBus.validate('test.custom.invalid', { project: 'invalid' }, {})
      assert.strictEqual(result.ok, false)
      assert.ok(result.errors.some(e => e.includes('must start with PRJ-')))
    })

    it('should throw error for invalid resolver registration', () => {
      assert.throws(() => {
        commandBus.registerTypeResolver('', () => {})
      }, /non-empty string/)

      assert.throws(() => {
        commandBus.registerTypeResolver('test', 'not a function')
      }, /must be a function/)
    })
  })

  describe('propose() and confirm()', () => {
    let executeCalled
    let executeArgs

    beforeEach(() => {
      executeCalled = false
      executeArgs = null

      commandBus.register({
        id: 'test.sideeffect',
        description: 'Command with side effects',
        sideEffects: ['modifies database'],
        args: {
          action: { type: 'string', required: true }
        },
        handler: async (ctx) => {
          executeCalled = true
          executeArgs = ctx.args
          return 'Command executed!'
        }
      })
    })

    it('should create pending proposal for side-effect command', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      const proposal = await commandBus.propose({
        commandId: 'test.sideeffect',
        args: { action: 'delete' }
      }, context)

      assert.ok(proposal)
      assert.strictEqual(proposal.commandId, 'test.sideeffect')
      assert.ok(proposal.preview)
      assert.ok(proposal.confirmationKey)
    })

    it('should execute on confirm("yes")', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      await commandBus.propose({
        commandId: 'test.sideeffect',
        args: { action: 'delete' }
      }, context)

      const result = await commandBus.confirm('yes', context)

      assert.ok(result)
      assert.strictEqual(result.executed, true)
      assert.ok(executeCalled)
      assert.strictEqual(executeArgs.action, 'delete')
    })

    it('should cancel on confirm("no")', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      await commandBus.propose({
        commandId: 'test.sideeffect',
        args: { action: 'delete' }
      }, context)

      const result = await commandBus.confirm('no', context)

      assert.ok(result)
      assert.strictEqual(result.cancelled, true)
      assert.strictEqual(executeCalled, false)
    })

    it('should cancel on confirm("cancel")', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      await commandBus.propose({
        commandId: 'test.sideeffect',
        args: { action: 'delete' }
      }, context)

      const result = await commandBus.confirm('cancel', context)

      assert.ok(result)
      assert.strictEqual(result.cancelled, true)
      assert.strictEqual(executeCalled, false)
    })

    it('should return null if no pending confirmation exists', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      const result = await commandBus.confirm('yes', context)
      assert.strictEqual(result, null)
    })
  })

  describe('_renderPreview()', () => {
    it('should escape quotes inside quoted values', () => {
      const preview = commandBus._renderPreview('test.preview', {
        message: 'test "quoted" text'
      })

      assert.strictEqual(preview, 'test.preview --message "test \\\"quoted\\\" text"')
    })
  })

  describe('confirm policy', () => {
    it('should require confirmation when confirm=always', async () => {
      commandBus.register({
        id: 'test.always',
        description: 'Always confirm',
        confirm: 'always',
        handler: async () => {}
      })

      const needsConfirm = commandBus.needsConfirmation('test.always')
      assert.strictEqual(needsConfirm, true)
    })

    it('should not require confirmation when confirm=never', async () => {
      commandBus.register({
        id: 'test.never',
        description: 'Never confirm',
        confirm: 'never',
        handler: async () => {}
      })

      const needsConfirm = commandBus.needsConfirmation('test.never')
      assert.strictEqual(needsConfirm, false)
    })

    it('should require confirmation for commands with sideEffects', async () => {
      commandBus.register({
        id: 'test.effects',
        description: 'Has side effects',
        sideEffects: ['deletes data'],
        handler: async () => {}
      })

      const needsConfirm = commandBus.needsConfirmation('test.effects')
      assert.strictEqual(needsConfirm, true)
    })
  })

  describe('execute()', () => {
    it('should pass args and context to handler', async () => {
      let received

      commandBus.register({
        id: 'test.execute.ctx',
        description: 'Execution context shape',
        handler: async (ctx) => {
          received = ctx
          return 'ok'
        }
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1',
        message: { id: 'm1' },
        res: { id: 'r1' }
      }

      const result = await commandBus.execute('test.execute.ctx', { foo: 'bar' }, context)

      assert.strictEqual(result, 'ok')
      assert.deepStrictEqual(received.args, { foo: 'bar' })
      assert.deepStrictEqual(received.context, context)
    })
  })

  describe('permissions', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'test.restricted',
        description: 'Restricted to specific rooms',
        permissions: {
          rooms: ['#ops', '#admin']
        },
        handler: async () => 'Success'
      })
    })

    it('should allow execution in allowed rooms', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: '#ops'
      }

      const result = await commandBus.execute('test.restricted', {}, context)
      assert.strictEqual(result, 'Success')
    })

    it('should deny execution in disallowed rooms', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: '#general'
      }

      await assert.rejects(
        async () => await commandBus.execute('test.restricted', {}, context),
        /Permission denied/
      )
    })

    it('should allow execution when user has required role', async () => {
      const permissionProvider = {
        hasRole: async (user, roles, context) => {
          return roles.includes('admin') && user.id === 'user1'
        }
      }

      const busCfg = new CommandBus(robot, { permissionProvider })
      busCfg.register({
        id: 'test.role.restricted',
        description: 'Restricted by role',
        permissions: {
          roles: ['admin']
        },
        handler: async () => 'Success'
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: '#general'
      }

      const result = await busCfg.execute('test.role.restricted', {}, context)
      assert.strictEqual(result, 'Success')
    })

    it('should deny execution when user lacks required role', async () => {
      const permissionProvider = {
        hasRole: async (user, roles, context) => {
          return false
        }
      }

      const busCfg = new CommandBus(robot, { permissionProvider })
      busCfg.register({
        id: 'test.role.denied',
        description: 'Restricted by role',
        permissions: {
          roles: ['admin']
        },
        handler: async () => 'Success'
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: '#general'
      }

      await assert.rejects(
        async () => await busCfg.execute('test.role.denied', {}, context),
        /Permission denied: insufficient role/
      )
    })

    it('should check multiple roles and allow if user has any required role', async () => {
      const permissionProvider = {
        hasRole: async (user, roles, context) => {
          const userRoles = new Set(['developer', 'reviewer'])
          return roles.some(role => userRoles.has(role))
        }
      }

      const busCfg = new CommandBus(robot, { permissionProvider })
      busCfg.register({
        id: 'test.multi.role',
        description: 'Multiple roles allowed',
        permissions: {
          roles: ['admin', 'developer', 'lead']
        },
        handler: async () => 'Success'
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: '#general'
      }

      const result = await busCfg.execute('test.multi.role', {}, context)
      assert.strictEqual(result, 'Success')
    })

    it('should allow execution without permissionProvider when roles defined', async () => {
      const busCfg = new CommandBus(robot)
      busCfg.register({
        id: 'test.no.provider',
        description: 'Roles but no provider',
        permissions: {
          roles: ['admin']
        },
        handler: async () => 'Success'
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: '#general'
      }

      const result = await busCfg.execute('test.no.provider', {}, context)
      assert.strictEqual(result, 'Success')
    })
  })

  describe('invoke()', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'test.invoke',
        description: 'Test invoke pipeline',
        args: {
          name: { type: 'string', required: true }
        },
        handler: async (ctx) => `Hello, ${ctx.args.name}!`
      })
    })

    it('should parse, validate, and execute in one call', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      const result = await commandBus.invoke('test.invoke --name alice', context)

      assert.ok(result)
      assert.strictEqual(result.result, 'Hello, alice!')
    })

    it('should return validation errors if invalid', async () => {
      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      const result = await commandBus.invoke('test.invoke', context)

      assert.ok(result)
      assert.strictEqual(result.ok, false)
      assert.ok(result.missing.includes('name'))
    })

    it('should return help when --help flag is provided', async () => {
      let executed = false

      commandBus.register({
        id: 'test.help.invoke',
        description: 'Help flag test',
        args: {
          name: { type: 'string', required: true }
        },
        handler: async () => {
          executed = true
          return 'executed'
        }
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      const result = await commandBus.invoke('test.help.invoke --help', context)

      assert.ok(result)
      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.helpOnly, true)
      assert.ok(result.result.includes('Usage:'))
      assert.strictEqual(executed, false)
    })
  })

  describe('listCommands()', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'admin.restart',
        description: 'Restart the bot',
        handler: async () => {}
      })
      commandBus.register({
        id: 'admin.status',
        description: 'Check bot status',
        handler: async () => {}
      })
      commandBus.register({
        id: 'user.profile',
        description: 'View user profile',
        handler: async () => {}
      })
    })

    it('should list all commands when no filter', () => {
      const commands = commandBus.listCommands()
      assert.strictEqual(commands.length, 3)
    })

    it('should filter commands by prefix', () => {
      const commands = commandBus.listCommands({ prefix: 'admin' })
      assert.strictEqual(commands.length, 2)
      assert.ok(commands.every(c => c.id.startsWith('admin')))
    })
  })

  describe('getHelp()', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'test.help',
        description: 'Test command for help',
        aliases: ['help.test', 'test help'],
        args: {
          name: { type: 'string', required: true },
          count: { type: 'number', default: 1 }
        },
        examples: [
          '/test.help --name alice',
          '/test.help --name bob --count 5'
        ],
        handler: async () => {}
      })
    })

    it('should return help text for a command', () => {
      const help = commandBus.getHelp('test.help')

      assert.ok(help)
      assert.ok(help.includes('test.help'))
      assert.ok(help.includes('Test command for help'))
      assert.ok(help.includes('Intent:'))
      assert.ok(help.includes('help.test'))
      assert.ok(help.includes('name'))
      assert.ok(help.includes('required'))
    })
  })

  describe('search()', () => {
    beforeEach(() => {
      commandBus.register({
        id: 'tickets.create',
        description: 'Create a support ticket',
        aliases: ['ticket new', 'create ticket'],
        examples: ['/tickets.create --title "VPN down"'],
        handler: async () => {}
      })
      commandBus.register({
        id: 'tickets.status',
        description: 'Check ticket status',
        aliases: ['ticket status'],
        handler: async () => {}
      })
    })

    it('should rank exact alias match highest', () => {
      const results = commandBus.search('ticket new')
      assert.ok(results.length > 0)
      assert.strictEqual(results[0].id, 'tickets.create')
      assert.strictEqual(results[0].matchedOn, 'alias')
    })

    it('should rank alias token overlap above description overlap', () => {
      const results = commandBus.search('ticket')
      assert.ok(results.length > 0)
      assert.strictEqual(results[0].matchedOn, 'alias')
    })
  })

  describe('aliasCollisions()', () => {
    it('should return collisions for normalized aliases', () => {
      commandBus.register({
        id: 'cmd.one',
        description: 'First command',
        aliases: ['My Alias'],
        handler: async () => {}
      })
      commandBus.register({
        id: 'cmd.two',
        description: 'Second command',
        aliases: ['my  alias'],
        handler: async () => {}
      })

      const collisions = commandBus.aliasCollisions()
      assert.deepStrictEqual(collisions['my alias'], ['cmd.one', 'cmd.two'])
    })
  })

  describe('event emission', () => {
    it('should emit commands:registered event', (t, done) => {
      commandBus.on('commands:registered', (event) => {
        assert.strictEqual(event.commandId, 'test.event')
        done()
      })

      commandBus.register({
        id: 'test.event',
        description: 'Test event emission',
        handler: async () => {}
      })
    })

    it('should emit commands:invocation_parsed event', (t, done) => {
      commandBus.register({
        id: 'test.parse',
        description: 'Test parse',
        handler: async () => {}
      })

      commandBus.on('commands:invocation_parsed', (event) => {
        assert.strictEqual(event.commandId, 'test.parse')
        done()
      })

      commandBus.parse('test.parse --arg value')
    })
  })

  describe('TTL for pending proposals', () => {
    it('should expire pending proposals after TTL', async (t) => {
      const shortTTL = 100 // 100ms
      const busWithShortTTL = new CommandBus(robot, { proposalTTL: shortTTL, disableLogging: true })

      busWithShortTTL.register({
        id: 'test.ttl',
        description: 'Test TTL',
        sideEffects: ['test'],
        handler: async () => 'Done'
      })

      const context = {
        user: { id: 'user1', name: 'alice' },
        room: 'room1'
      }

      await busWithShortTTL.propose({
        commandId: 'test.ttl',
        args: {}
      }, context)

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      const result = await busWithShortTTL.confirm('yes', context)
      assert.strictEqual(result, null) // Should be expired
      
      // Clean up any remaining timers
      busWithShortTTL.clearPendingProposals()
    })
  })
})
