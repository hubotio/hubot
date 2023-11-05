const EventEmitter = require('node:events')
class OptParse extends EventEmitter {
  constructor (switches) {
    super()
    this.switches = switches
  }

  mappings (switches) {
    const mappings = switches.reduce((acc, current) => {
      acc[current[0].replace('-', '')] = current[1].split(' ')[0].replace('--', '')
      return acc
    }, {})
    return mappings
  }

  parse (args) {
    const mappings = this.mappings(this.switches)
    const options = {}
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg.startsWith('-')) {
        let key = arg.replace(/^-+/, '')
        key = mappings[key] || key
        key = key.replace(/-([a-z])/g, g => g[1].toUpperCase())
        const nextArg = args[i + 1]
        if (nextArg && !nextArg.startsWith('-')) {
          options[key] = nextArg
          i++
        } else {
          options[key] = true
        }
        this.emit(key, key, nextArg)
      }
    }
    return options
  }
}

module.exports = OptParse
