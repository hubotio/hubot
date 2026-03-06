import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import OptParse from '../src/OptParse.mjs'

describe('CLI Argument Parsing', () => {
  it('should parse arguments into options', () => {
    const switches = [
      ['-a', '--adapter HUBOT_ADAPTER', 'The Adapter to use, e.g. "Shell" (to load the default hubot Shell adapter)'],
      ['-f', '--file HUBOT_FILE', 'Path to adapter file, e.g. "./adapters/CustomAdapter.mjs"'],
      ['-c', '--create HUBOT_CREATE', 'Create a deployable hubot'],
      ['-d', '--disable-httpd HUBOT_HTTPD', 'Disable the HTTP server'],
      ['-h', '--help', 'Display the help information'],
      ['-l', '--alias HUBOT_ALIAS', "Enable replacing the robot's name with alias"],
      ['-n', '--name HUBOT_NAME', 'The name of the robot in chat'],
      ['-r', '--require PATH', 'Alternative scripts path'],
      ['-t', '--config-check', "Test hubot's config to make sure it won't fail at startup"],
      ['-v', '--version', 'Displays the version of hubot installed']
    ]

    const options = {
      adapter: null,
      alias: false,
      create: false,
      enableHttpd: true,
      scripts: [],
      name: 'Hubot',
      file: null,
      configCheck: false
    }

    const Parser = new OptParse(switches)
    Parser.on('adapter', (opt, value) => {
      options.adapter = value
    })
    Parser.on('disable-httpd', (opt, value) => {
      options.enableHttpd = false
    })
    Parser.on('alias', (opt, value) => {
      options.alias = value
    })
    Parser.parse(['-a', 'Shell', '-d', '--alias', 'bot'])
    assert.deepEqual(options.adapter, 'Shell')
    assert.deepEqual(options.enableHttpd, false)
    assert.deepEqual(options.alias, 'bot')
  })
})
