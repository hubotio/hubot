'use strict'

const fs = require('fs')
const readline = require('node:readline')
const Adapter = require('../adapter')
const { TextMessage } = require('../message')

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
  console.log('\\q, exit - close shell and exit')
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
    if (!fs.existsSync(historyPath)) {
      fs.writeFileSync(historyPath, '')
    }
    const stats = fs.statSync(historyPath)
    if (stats.size > historySize) {
      fs.unlinkSync(historyPath)
    }
    this.#rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${this.robot.name ?? this.robot.alias}> `,
      completer
    })
    this.#rl.on('line', async (line) => {
      const input = line.trim()
      switch (input) {
        case '\\q':
        case 'exit':
          this.#rl.close()
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
      const history = fs.readFileSync(historyPath, 'utf-8').split('\n').reverse()
      this.#rl.history = history
      this.#rl.on('line', line => {
        const input = line.trim()
        if (input.length === 0) return
        fs.appendFile(historyPath, `${input}\n`, err => {
          if (err) console.error(err)
        })
      })
      let userId = process.env.HUBOT_SHELL_USER_ID || '1'
      if (userId.match(/A\d+z/)) {
        userId = parseInt(userId)
      }

      const userName = process.env.HUBOT_SHELL_USER_NAME || 'Shell'
      const user = this.robot.brain.userForId(userId, { name: userName, room: 'Shell' })
      await this.receive(new TextMessage(user, input, 'messageId'))
      this.#rl.prompt()
    }).on('close', () => {
      process.exit(0)
    })
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
    this.cli.removeAllListeners()
    this.cli.close()
  }
}

// Prevent output buffer "swallowing" every other character on OSX / Node version > 16.19.0.
process.stdout._handle.setBlocking(false)
exports.use = robot => new Shell(robot)
