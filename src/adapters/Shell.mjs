'use strict'

import fs from 'node:fs'
import readline from 'node:readline'
import Adapter from '../Adapter.mjs'
import { TextMessage } from '../Message.mjs'

const historySize = process.env.HUBOT_SHELL_HISTSIZE != null ? parseInt(process.env.HUBOT_SHELL_HISTSIZE) : 1024
const historyPath = '.hubot_history'

const completer = line => {
  const completions = '\\q exit \\? help \\c clear'.split(' ')
  const hits = completions.filter((c) => c.startsWith(line))
  // Show all completions if none found
  return [hits.length ? hits : completions, line]
}
const showHelp = () => {
  console.log('usage:')
  console.log('\\q, exit - close Shell and exit')
  console.log('\\?, help - show this help')
  console.log('\\c, clear - clear screen')
}

const bold = str => `\x1b[1m${str}\x1b[22m`

class Shell extends Adapter {
  #rl = null
  constructor (robot) {
    super(robot)
    this.name = 'Shell'
  }

  async send (envelope, ...strings) {
    Array.from(strings).forEach(str => console.log(bold(str)))
  }

  async emote (envelope, ...strings) {
    Array.from(strings).map(str => this.send(envelope, `* ${str}`))
  }

  async reply (envelope, ...strings) {
    strings = strings.map((s) => `${envelope.user.name}: ${s}`)
    this.send(envelope, ...strings)
  }

  async run () {
    const stats = fs.statSync(historyPath)
    if (stats.size > historySize) {
      fs.unlinkSync(historyPath)
    }
    if (!fs.existsSync(historyPath)) {
      fs.writeFileSync(historyPath, '')
    }

    this.#rl = readline.createInterface({
      input: this.robot.stdin ?? process.stdin,
      output: this.robot.stdout ?? process.stdout,
      prompt: `${this.robot.name ?? this.robot.alias}> `,
      completer
    })
    this.#rl.on('line', async (line) => {
      const input = line.trim()
      switch (input) {
        case '\\q':
        case 'exit':
          this.#rl.close()
          process.exit(0)
          break
        case '\\?':
        case 'help':
          showHelp()
          break
        case '\\c':
        case 'clear':
          this.#rl.write(null, { ctrl: true, name: 'l' })
          this.#rl.prompt()
          break
      }
      if (input.length > 0) {
        this.#rl.history.push(input)
      }
      let userId = process.env.HUBOT_SHELL_USER_ID || '1'
      if (userId.match(/A\d+z/)) {
        userId = parseInt(userId)
      }
      const userName = process.env.HUBOT_SHELL_USER_NAME || 'Shell'
      const user = this.robot.brain.userForId(userId, { name: userName, room: 'Shell' })
      const message = new TextMessage(user, input, 'messageId')
      if (!message.text.startsWith(this.robot.name) && !message.text.startsWith(this.robot.alias)) {
        message.text = `${this.robot.name} ${message.text}`
      }
      await this.receive(message)
      this.#rl.prompt()
    })

    this.#rl.on('history', async (history) => {
      if (history.length === 0) return
      await fs.promises.appendFile(historyPath, `${history[0]}\n`)
    })

    const existingHistory = (await fs.promises.readFile(historyPath, 'utf8')).split('\n')
    existingHistory.reverse().forEach(line => this.#rl.history.push(line))

    try {
      this.#rl.prompt()
      this.emit('connected', this)
    } catch (error) {
      console.log(error)
    }
  }

  close () {
    super.close()
    if (this.#rl?.close) {
      this.#rl.close()
    }
  }
}

// Prevent output buffer "swallowing" every other character on OSX / Node version > 16.19.0.
process.stdout._handle.setBlocking(false)
export default {
  use (robot) {
    return new Shell(robot)
  }
}
