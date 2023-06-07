'use strict'

const fs = require('fs')
const pathResolve = require('path').resolve

const OptParse = require('optparse')

const Hubot = require('..')

const switches = [
  ['-a', '--adapter ADAPTER', 'The Adapter to use, e.g. "shell" (to load the default hubot shell adapter)'],
  ['-f', '--file PATH', 'Path to adapter file, e.g. "./adapters/CustomAdapter.mjs"'],
  ['-c', '--create PATH', 'Create a deployable hubot'],
  ['-d', '--disable-httpd', 'Disable the HTTP server'],
  ['-h', '--help', 'Display the help information'],
  ['-l', '--alias ALIAS', "Enable replacing the robot's name with alias"],
  ['-n', '--name NAME', 'The name of the robot in chat'],
  ['-r', '--require PATH', 'Alternative scripts path'],
  ['-t', '--config-check', "Test hubot's config to make sure it won't fail at startup"],
  ['-v', '--version', 'Displays the version of hubot installed']
]

const options = {
  adapter: process.env.HUBOT_ADAPTER,
  alias: process.env.HUBOT_ALIAS || false,
  create: process.env.HUBOT_CREATE || false,
  enableHttpd: process.env.HUBOT_HTTPD !== 'false',
  scripts: process.env.HUBOT_SCRIPTS || [],
  name: process.env.HUBOT_NAME || 'Hubot',
  file: process.env.HUBOT_FILE,
  configCheck: false
}

const Parser = new OptParse.OptionParser(switches)
Parser.banner = 'Usage hubot [options]'

Parser.on('adapter', (opt, value) => {
  options.adapter = value
})

Parser.on('file', (opt, value) => {
  options.file = value
})

Parser.on('create', function (opt, value) {
  options.path = value
  options.create = true
})

Parser.on('disable-httpd', opt => {
  options.enableHttpd = false
})

Parser.on('help', function (opt, value) {
  console.log(Parser.toString())
  return process.exit(0)
})

Parser.on('alias', function (opt, value) {
  if (!value) {
    value = '/'
  }
  options.alias = value
})

Parser.on('name', (opt, value) => {
  options.name = value
})

Parser.on('require', (opt, value) => {
  options.scripts.push(value)
})

Parser.on('config-check', opt => {
  options.configCheck = true
})

Parser.on('version', (opt, value) => {
  options.version = true
})

Parser.on((opt, value) => {
  console.warn(`Unknown option: ${opt}`)
})

Parser.parse(process.argv)

if (options.create) {
  console.error("'hubot --create' is deprecated. Use the yeoman generator instead:")
  console.error('    npm install -g yo generator-hubot')
  console.error(`    mkdir -p ${options.path}`)
  console.error(`    cd ${options.path}`)
  console.error('    yo hubot')
  console.error('See https://github.com/github/hubot/blob/master/docs/index.md for more details on getting started.')
  process.exit(1)
}
if (options.file) {
  options.adapter = options.file.split('/').pop().split('.')[0]
}
const robot = Hubot.loadBot(options.adapter, options.enableHttpd, options.name, options.alias)

function loadScripts () {
  console.log('loading scripts')
  robot.load(pathResolve('.', 'scripts'))
  robot.load(pathResolve('.', 'src', 'scripts'))

  loadExternalScripts()

  options.scripts.forEach((scriptPath) => {
    console.log('loadding', scriptPath)
    if (scriptPath[0] === '/') {
      return robot.load(scriptPath)
    }

    robot.load(pathResolve('.', scriptPath))
  })
}

function loadExternalScripts () {
  const externalScripts = pathResolve('.', 'external-scripts.json')

  if (!fs.existsSync(externalScripts)) {
    return
  }

  fs.readFile(externalScripts, function (error, data) {
    if (error) {
      throw error
    }

    try {
      robot.loadExternalScripts(JSON.parse(data))
    } catch (error) {
      console.error(`Error parsing JSON data from external-scripts.json: ${error}`)
      process.exit(1)
    }
  })
}

(async () => {
  await robot.loadAdapter(options.file)
  if (options.version) {
    console.log(robot.version)
    process.exit(0)
  }

  if (options.configCheck) {
    loadScripts()
    console.log('OK')
    process.exit(0)
  }

  robot.adapter.once('connected', loadScripts)

  robot.run()
})()
