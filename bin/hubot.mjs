#!/usr/bin/env node
'use strict'
import File from 'fs/promises'
import { resolve as pathResolve } from 'path'
import OptParse from 'optparse'
import Hubot from '../index.mjs'
import path from 'path'
import { fileURLToPath } from 'url'

const switches = [
  ['-a', '--adapter ADAPTER', 'The Adapter to use'],
  ['-c', '--create PATH', 'Create a deployable hubot'],
  ['-p', '--port', 'HTTP server port (0 for random)'],
  ['-h', '--help', 'Display the help information'],
  ['-l', '--alias ALIAS', "Enable replacing the robot's name with alias"],
  ['-n', '--name NAME', 'The name of the robot in chat'],
  ['-r', '--require PATH', 'Alternative scripts path'],
  ['-t', '--config-check', "Test hubot's config to make sure it won't fail at startup"],
  ['-v', '--version', 'Displays the version of hubot installed'],
  ['-c', '--cert CERT', 'Path to SSL certificate'],
  ['-k', '--key KEY', 'Path to SSL key']
]

const options = {
  adapter: process.env.HUBOT_ADAPTER || 'shell',
  alias: process.env.HUBOT_ALIAS ? process.env.HUBOT_ALIAS !== 'false' : false,
  create: process.env.HUBOT_CREATE ? process.env.HUBOT_CREATE !== 'false' : false,
  enableHttpd: process.env.HUBOT_HTTPD ? process.env.HUBOT_HTTPD !== 'false' : true,
  scripts: process.env.HUBOT_SCRIPTS || [],
  name: process.env.HUBOT_NAME || 'Hubot',
  path: process.env.HUBOT_PATH || '.',
  configCheck: false,
  port: process.env.HUBOT_PORT,
  cert: process.env.HUBOT_CERT,
  key: process.env.HUBOT_KEY

}
const Parser = new OptParse.OptionParser(switches)
Parser.banner = 'Usage hubot [options]'

Parser.on('adapter', (opt, value) => {
  options.adapter = value
})

Parser.on('create', function (opt, value) {
  options.path = value
  options.create = true
})

Parser.on('port', function (opt, value) {
  options.port = value
})

Parser.on('cert', function (opt, value) {
  options.cert = value
})

Parser.on('key', function (opt, value) {
  options.key = value
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

if (process.platform !== 'win32') {
  process.on('SIGTERM', () => process.exit(0))
}

if (options.create) {
  console.error("'hubot --create' is deprecated. Use the yeoman generator instead:")
  console.error('    npm install -g yo generator-hubot')
  console.error(`    mkdir -p ${options.path}`)
  console.error(`    cd ${options.path}`)
  console.error('    yo hubot')
  console.error('See https://github.com/github/hubot/blob/master/docs/index.md for more details on getting started.')
  process.exit(1)
}
const dirName = fileURLToPath(import.meta.url).replace('/bin/hubot.mjs', '')
let robot = null
Hubot.loadBot(`${dirName}/src/adapters`, options.adapter, options.name, options.alias, options.port, options).then(bot => {
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
  robot.load(pathResolve('.', 'scripts'))
  robot.load(pathResolve('.', 'src', 'scripts'))

  await loadHubotScripts()
  await loadExternalScripts()
  for await (const scriptPath of options.scripts) {
    if (scriptPath[0] === '/') {
      return await robot.load(scriptPath)
    }
    await robot.load(pathResolve('.', scriptPath))
  }
}

async function loadHubotScripts () {
  const hubotScripts = pathResolve('.', 'hubot-scripts.json')
  let scripts
  let scriptsPath
  try{
    const stats = await File.stat(hubotScripts)
  }catch(err){
    // hubot-scripts.json doesn't exist
    return
  }
  try{
    let hubotScriptsWarning
    const data = await File.readFile(hubotScripts)

    if (data.length === 0) {
      return
    }

    try {
      scripts = JSON.parse(data)
      scriptsPath = pathResolve('node_modules', 'hubot-scripts', 'src', 'scripts')
      await robot.loadHubotScripts(scriptsPath, scripts)
    } catch (error) {
      const err = error
      robot.logger.error(`Error parsing JSON data from hubot-scripts.json: ${err}`)
      process.exit(1)
    }

    hubotScriptsWarning = 'Loading scripts from hubot-scripts.json is deprecated and ' + 'will be removed in 3.0 (https://github.com/github/hubot-scripts/issues/1113) ' + 'in favor of packages for each script.\n\n'

    if (scripts.length === 0) {
      hubotScriptsWarning += 'Your hubot-scripts.json is empty, so you just need to remove it.'
      return robot.logger.warning(hubotScriptsWarning)
    }

    const hubotScriptsReplacements = pathResolve('node_modules', 'hubot-scripts', 'replacements.json')
    const replacementsData = await File.readFile(hubotScriptsReplacements)
    const replacements = JSON.parse(replacementsData)
    const scriptsWithoutReplacements = []

    if (!await File.exists(hubotScriptsReplacements)) {
      hubotScriptsWarning += 'To get a list of recommended replacements, update your hubot-scripts: npm install --save hubot-scripts@latest'
      return robot.logger.warning(hubotScriptsWarning)
    }

    hubotScriptsWarning += 'The following scripts have known replacements. Follow the link for installation instructions, then remove it from hubot-scripts.json:\n'

    scripts.forEach((script) => {
      const replacement = replacements[script]

      if (replacement) {
        hubotScriptsWarning += `* ${script}: ${replacement}\n`
      } else {
        scriptsWithoutReplacements.push(script)
      }
    })

    hubotScriptsWarning += '\n'

    if (scriptsWithoutReplacements.length > 0) {
      hubotScriptsWarning += 'The following scripts don’t have (known) replacements. You can try searching https://www.npmjs.com/ or http://github.com/search or your favorite search engine. You can copy the script into your local scripts directory, or consider creating a new package to maintain yourself. If you find a replacement or create a package yourself, please post on https://github.com/github/hubot-scripts/issues/1641:\n'
      hubotScriptsWarning += scriptsWithoutReplacements.map((script) => `* ${script}\n`).join('')
      hubotScriptsWarning += '\nYou an also try updating hubot-scripts to get the latest list of replacements: npm install --save hubot-scripts@latest'
    }

    robot.logger.warning(hubotScriptsWarning)
  }catch(err){
    robot.logger.error(err)
  }
}

async function loadExternalScripts () {
  const externalScripts = pathResolve('.', 'external-scripts.json')
  try{
    const stats = await File.stat(externalScripts)
  }catch(err){
    return
  }
  try{
    const data = await File.readFile(externalScripts)
    await robot.loadExternalScripts(JSON.parse(data))
  }catch(error){
    robot.logger.error(`Error either parsing JSON data from external-scripts.json or file doesn't exist: ${error}`)
    process.exit(1)
  }
}
