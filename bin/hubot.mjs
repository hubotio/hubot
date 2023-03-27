#!/usr/bin/env bun
'use strict'
import OptParse from 'optparse'
import Hubot from '../index.mjs'
import { fileURLToPath } from 'node:url'
import path, {dirname} from 'node:path'

const switches = [
  ['-a', '--adapter ADAPTER', 'The path to the Adapter module (or an installed module) to use'],
  ['-h', '--help', 'Display the help information'],
  ['-l', '--alias ALIAS', "Enable replacing the robot's name with alias"],
  ['-n', '--name NAME', 'The name of the robot in chat'],
  ['-r', '--require PATH', 'Alternative scripts path'],
  ['-p', '--public PUBLIC', 'The path to the public directory'],
  ['-t', '--config-check', "Test hubot's config to make sure it won't fail at startup"],
  ['-v', '--version', 'Displays the version of hubot installed'],
  ['-c', '--cert CERT', 'Path to SSL certificate'],
  ['-k', '--key KEY', 'Path to SSL key'],
]
const __dirname = dirname(fileURLToPath(import.meta.url))
const options = {
  adapter: process.env.HUBOT_ADAPTER || path.resolve(__dirname, '../src/adapters/shell.mjs'),
  alias: process.env.HUBOT_ALIAS ? process.env.HUBOT_ALIAS !== 'false' : false,
  scripts: process.env.HUBOT_SCRIPTS || [],
  name: process.env.HUBOT_NAME || 'Hubot',
  path: process.env.HUBOT_PATH || '.',
  configCheck: false,
  cert: process.env.HUBOT_CERT,
  key: process.env.HUBOT_KEY

}
const Parser = new OptParse.OptionParser(switches)
Parser.banner = 'Usage hubot [options]'

Parser.on('adapter', (opt, value) => {
  options.adapter = value
})

Parser.on('cert', function (opt, value) {
  options.cert = value
})

Parser.on('key', function (opt, value) {
  options.key = value
})

Parser.on('help', function (opt, value) {
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
Parser.on('public', (opt, value) => {
  options.public = value
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

if (process.platform !== 'win32') {
  process.on('SIGTERM', () => process.exit(0))
}

let robot = null
Hubot.loadBot(options.adapter, options.name, options.alias, options).then(bot => {
  robot = bot
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
})

async function loadScripts () {
  robot.load(path.resolve('.', 'scripts'))
  robot.load(path.resolve('.', 'src', 'scripts'))
  for await (const scriptPath of options.scripts) {
    if (scriptPath[0] === '/') {
      return await robot.load(scriptPath)
    }
    await robot.load(path.resolve('.', scriptPath))
  }
}