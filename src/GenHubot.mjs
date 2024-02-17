import { spawnSync } from 'node:child_process'
import File from 'node:fs'
import path from 'node:path'

function runCommands (hubotDirectory, options) {
  options.hubotInstallationPath = options?.hubotInstallationPath ?? 'hubot'
  console.log('creating hubot directory', hubotDirectory)
  try {
    spawnSync('mkdir', [hubotDirectory])
  } catch (error) {
    console.log(`${hubotDirectory} exists, continuing to the next operation.`)
  }
  const envFilePath = path.resolve(process.cwd(), '.env')
  process.chdir(hubotDirectory)

  let output = spawnSync('npm', ['init', '-y'])
  console.log('npm init', output.stderr.toString())
  if (options.hubotInstallationPath !== 'hubot') {
    output = spawnSync('npm', ['pack', `${options.hubotInstallationPath}`])
    console.log('npm pack', output.stderr.toString(), output.stdout.toString())
    const customHubotPackage = JSON.parse(File.readFileSync(`${options.hubotInstallationPath}/package.json`, 'utf8'))
    output = spawnSync('npm', ['i', `${customHubotPackage.name}-${customHubotPackage.version}.tgz`])
    console.log(`npm i ${customHubotPackage.name}-${customHubotPackage.version}.tgz`, output.stderr.toString(), output.stdout.toString())
  } else {
    output = spawnSync('npm', ['i', 'hubot@latest'])
  }
  output = spawnSync('npm', ['i', 'hubot-help@latest', 'hubot-rules@latest', 'hubot-diagnostics@latest'].concat([options.adapter]).filter(Boolean))
  console.log('npm i', output.stderr.toString(), output.stdout.toString())
  spawnSync('mkdir', ['scripts', 'tests', 'tests/doubles'])
  spawnSync('touch', ['external-scripts.json'])

  const externalScriptsPath = path.resolve('./', 'external-scripts.json')
  let escripts = File.readFileSync(externalScriptsPath, 'utf8')
  if (escripts.length === 0) escripts = '[]'
  const externalScripts = JSON.parse(escripts)
  externalScripts.push('hubot-help')
  externalScripts.push('hubot-rules')
  externalScripts.push('hubot-diagnostics')

  File.writeFileSync(externalScriptsPath, JSON.stringify(externalScripts, null, 2))

  File.writeFileSync('./scripts/Xample.mjs', `// Description:
//   Test script
//
// Commands:
//   hubot helo - Responds with Hello World!.
//
// Notes:
//   This is a test script.
//

export default (robot) => {
  robot.respond(/helo$/, async res => {
    await res.reply("HELO World! I'm Dumbotheelephant.")
  })
  robot.respond(/helo room/, async res => {
    await res.send('Hello World!')
  })
  robot.router.get('/helo', async (req, res) => {
    res.send("HELO World! I'm Dumbotheelephant.")
  })
}`)

  File.writeFileSync('./tests/doubles/DummyAdapter.mjs', `
  'use strict'
  import { Adapter, TextMessage } from 'hubot'
  
  export class DummyAdapter extends Adapter {
    constructor (robot) {
      super(robot)
      this.name = 'DummyAdapter'
      this.messages = new Set()
    }
  
    async send (envelope, ...strings) {
      this.emit('send', envelope, ...strings)
      this.robot.emit('send', envelope, ...strings)
    }
  
    async reply (envelope, ...strings) {
      this.emit('reply', envelope, ...strings)
      this.robot.emit('reply', envelope, ...strings)
    }
  
    async topic (envelope, ...strings) {
      this.emit('topic', envelope, ...strings)
      this.robot.emit('topic', envelope, ...strings)
    }
  
    async play (envelope, ...strings) {
      this.emit('play', envelope, ...strings)
      this.robot.emit('play', envelope, ...strings)
    }
  
    run () {
      // This is required to get the scripts loaded
      this.emit('connected')
    }
  
    close () {
      this.emit('closed')
    }
  
    async say (user, message, room) {
      this.messages.add(message)
      user.room = room
      await this.robot.receive(new TextMessage(user, message))
    }
  }
  export default {
    use (robot) {
      return new DummyAdapter(robot)
    }
  }
`)
  File.writeFileSync('./tests/XampleTest.mjs', `
  import { describe, it, beforeEach, afterEach } from 'node:test'
  import assert from 'node:assert/strict'
  
  import { Robot } from 'hubot'
  
  // You need a dummy adapter to test scripts
  import dummyRobot from './doubles/DummyAdapter.mjs'
  
  // Mocks Aren't Stubs
  // https://www.martinfowler.com/articles/mocksArentStubs.html
  
  describe('Xample testing Hubot scripts', () => {
    let robot = null
    beforeEach(async () => {
      robot = new Robot(dummyRobot, true, 'Dumbotheelephant')
      await robot.loadAdapter()
      await robot.run()
      await robot.loadFile('./scripts', 'Xample.mjs')
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('should handle /helo request', async () => {
      const expected = "HELO World! I'm Dumbotheelephant."
      const url = 'http://localhost:' + robot.server.address().port + '/helo'
      const response = await fetch(url)
      const actual = await response.text()
      assert.strictEqual(actual, expected)
      })
    it('should reply with expected message', async () => {
      const expected = "HELO World! I'm Dumbotheelephant."
      const user = robot.brain.userForId('test-user', { name: 'test user' })
      let actual = ''
      robot.on('reply', (envelope, ...strings) => {
        actual = strings.join('')
      })
      await robot.adapter.say(user, '@Dumbotheelephant helo', 'test-room')
      assert.strictEqual(actual, expected)
    })
  
    it('should send message to the #general room', async () => {
      const expected = 'general'
      const user = robot.brain.userForId('test-user', { name: 'test user' })
      let actual = ''
      robot.on('send', (envelope, ...strings) => {
        actual = envelope.room
      })
      await robot.adapter.say(user, '@Dumbotheelephant helo room', 'general')
      assert.strictEqual(actual, expected)
    })
  })  
`)

  const packageJsonPath = path.resolve(process.cwd(), 'package.json')
  const packageJson = JSON.parse(File.readFileSync(packageJsonPath, 'utf8'))

  packageJson.scripts = {
    start: 'hubot',
    test: 'node --test'
  }
  packageJson.description = 'A simple helpful robot for your Company'
  if (options.adapter) {
    packageJson.scripts.start += ` --adapter ${options.adapter}`
  }

  File.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('package.json updated successfully.')
  const hubotEnvFilePath = path.resolve('.env')

  try {
    File.accessSync(envFilePath)
    File.copyFileSync(envFilePath, hubotEnvFilePath)
    console.log('.env file copied successfully.')

    const envContent = File.readFileSync(hubotEnvFilePath, 'utf8')
    const envLines = envContent.split('\n')

    for (const line of envLines) {
      const trimmedLine = line.trim()

      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...values] = trimmedLine.split('=')
        const value = values.join('=')
        process.env[key] = value
      }
    }
  } catch (error) {
    console.log('.env file not found, continuing to the next operation.')
  }
}
export default (hubotDirectory, options) => {
  try {
    runCommands(hubotDirectory, options)
  } catch (error) {
    console.error('An error occurred:', error)
  }
}
