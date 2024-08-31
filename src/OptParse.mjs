import EventEmitter from 'node:events'
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
    let mappings = this.mappings(this.switches)
    let options = {}
    for (let i = 0; i < args.length; i++) {
      let arg = args[i]
      if (arg.startsWith('-')) {
        let cliArg = arg.replace(/^-+/, '')
        let propertyName = mappings[cliArg]
        if (!propertyName) {
          propertyName = Object.values(mappings).find(value => value === cliArg)
        }
        let nameToEmit = propertyName
        propertyName = propertyName.replace(/-([a-z])/g, g => g[1].toUpperCase())
        let nextArg = args[i + 1]
        if (nextArg && !nextArg.startsWith('-')) {
          options[propertyName] = nextArg
          i++
        } else {
          options[propertyName] = true
        }
        this.emit(nameToEmit, propertyName, nextArg)
      }
    }
    return options
  }

  toString () {
    return `${this.banner}
${this.switches.map(([key, description]) => `  ${key}, ${description}`).join('\n')}`
  }
}

export default OptParse
