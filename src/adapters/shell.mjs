'use strict'
import fs from 'fs'
import readline from 'readline'
import Stream from 'stream'
import cline from 'cline'
import Adapter from '../adapter.js'
import _require from '../message.js'

const TextMessage = _require.TextMessage

const historySize = process.env.HUBOT_SHELL_HISTSIZE != null ? parseInt(process.env.HUBOT_SHELL_HISTSIZE) : 1024

const historyPath = '.hubot_history'

class Shell extends Adapter {
  send (envelope, ...strings) {
    Array.from(strings).forEach(str => console.log(`\u001B[1m${str}\u001B[22m`))
    this.cli.prompt(`${this.robot.name}> `)
  }

  emote (envelope, ...strings) {
    strings.map(str => this.send(envelope, `* ${str}`))
  }

  reply (envelope, ...strings) {
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
      return this.emit('connected')
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
      outstream.on('finish', this.shutdown.bind(this))

      for (i = 0, len = history.length; i < len; i++) {
        item = history[i]
        outstream.write(item + '\n')
      }

      outstream.end(this.shutdown.bind(this))
    })
  }
}

export default (robot)=>new Shell(robot)

process.stdout._handle.setBlocking(false)

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
