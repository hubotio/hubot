'use strict'

const fs = require('fs')
const readline = require('readline')
const Stream = require('stream')
const cline = require('cline')

const Adapter = require('../adapter')

const _require = require('../message')

const TextMessage = _require.TextMessage

const historySize = process.env.HUBOT_SHELL_HISTSIZE != null ? parseInt(process.env.HUBOT_SHELL_HISTSIZE) : 1024

const historyPath = '.hubot_history'
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
    this.buildCli()
    try {
      const { readlineInterface, history } = await this.#loadHistory()
      this.cli.history(history)
      this.cli.interact(`${this.robot.name ?? this.robot.alias}> `)
      this.#rl = readlineInterface
      this.emit('connected', this)
    } catch (error) {
      console.log(error)
    }
  }

  close () {
    super.close()
    // Getting an error message on GitHubt Actions: error: 'this[#rl].close is not a function'
    if (this.#rl?.close) {
      this.#rl.close()
    }
    this.cli.removeAllListeners()
    this.cli.close()
  }

  buildCli () {
    this.cli = cline()

    this.cli.command('*', async input => {
      let userId = process.env.HUBOT_SHELL_USER_ID || '1'
      if (userId.match(/A\d+z/)) {
        userId = parseInt(userId)
      }

      const userName = process.env.HUBOT_SHELL_USER_NAME || 'Shell'
      const user = this.robot.brain.userForId(userId, { name: userName, room: 'Shell' })
      await this.receive(new TextMessage(user, input, 'messageId'))
    })

    this.cli.command('history', () => {
      Array.from(this.cli.history()).map(item => console.log(item))
    })

    this.cli.on('history', item => {
      if (item.length > 0 && item !== 'exit' && item !== 'history') {
        fs.appendFile(historyPath, `${item}\n`, error => {
          if (error) {
            this.robot.emit('error', error)
          }
        })
      }
    })

    this.cli.on('close', () => {
      let history, i, item, len

      history = this.cli.history()

      if (history.length <= historySize) {
        return
      }

      const startIndex = history.length - historySize
      history = history.reverse().splice(startIndex, historySize)
      const fileOpts = {
        mode: 0x180
      }

      const outstream = fs.createWriteStream(historyPath, fileOpts)
      for (i = 0, len = history.length; i < len; i++) {
        item = history[i]
        outstream.write(item + '\n')
      }
      outstream.end()
    })
  }

  async #loadHistory () {
    if (!fs.existsSync(historyPath)) {
      return new Error('No history available')
    }
    const instream = fs.createReadStream(historyPath)
    const outstream = new Stream()
    outstream.readable = true
    outstream.writable = true
    const history = []
    const readlineInterface = readline.createInterface({ input: instream, output: outstream, terminal: false })
    return new Promise((resolve, reject) => {
      readlineInterface.on('line', line => {
        line = line.trim()
        if (line.length > 0) {
          history.push(line)
        }
      })
      readlineInterface.on('close', () => {
        resolve({ readlineInterface, history })
      })
      readlineInterface.on('error', reject)
    })
  }
}

// Prevent output buffer "swallowing" every other character on OSX / Node version > 16.19.0.
process.stdout._handle.setBlocking(false)
exports.use = robot => new Shell(robot)
