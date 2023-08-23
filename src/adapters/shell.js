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

  run () {
    this.buildCli()
    loadHistory((error, history) => {
      if (error) {
        console.log(error.message)
      }
      this.cli.history(history)
      this.cli.interact(`${this.robot.name}> `)
      return this.emit('connected', this)
    })
  }

  shutdown () {
    this.robot.shutdown()
    return process.exit(0)
  }

  buildCli () {
    this.cli = cline()

    this.cli.command('*', input => {
      let userId = process.env.HUBOT_SHELL_USER_ID || '1'
      if (userId.match(/A\d+z/)) {
        userId = parseInt(userId)
      }

      const userName = process.env.HUBOT_SHELL_USER_NAME || 'Shell'
      const user = this.robot.brain.userForId(userId, { name: userName, room: 'Shell' })
      this.receive(new TextMessage(user, input, 'messageId'))
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
        return this.shutdown()
      }

      const startIndex = history.length - historySize
      history = history.reverse().splice(startIndex, historySize)
      const fileOpts = {
        mode: 0x180
      }

      const outstream = fs.createWriteStream(historyPath, fileOpts)
      outstream.on('end', this.shutdown.bind(this))
      for (i = 0, len = history.length; i < len; i++) {
        item = history[i]
        outstream.write(item + '\n')
      }
    })
  }
}

// Prevent output buffer "swallowing" every other character on OSX / Node version > 16.19.0.
process.stdout._handle.setBlocking(false)
exports.use = robot => new Shell(robot)

// load history from .hubot_history.
//
// callback - A Function that is called with the loaded history items (or an empty array if there is no history)
function loadHistory (callback) {
  if (!fs.existsSync(historyPath)) {
    return callback(new Error('No history available'))
  }

  const instream = fs.createReadStream(historyPath)
  const outstream = new Stream()
  outstream.readable = true
  outstream.writable = true

  const items = []

  readline.createInterface({ input: instream, output: outstream, terminal: false })
    .on('line', function (line) {
      line = line.trim()
      if (line.length > 0) {
        items.push(line)
      }
    })
    .on('close', () => callback(null, items))
    .on('error', callback)
}
