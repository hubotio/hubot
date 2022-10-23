'use strict'
import {Robot} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

describe('Name Matching', () => {
  it('matches messages starting with robot\'s name but wrapped in html', async () => {
    let pathToLookForAdapters = fileURLToPath(import.meta.url).replace('/test/NameMatching-test.mjs', '')
    pathToLookForAdapters = path.resolve(pathToLookForAdapters, 'test/fixtures')
    const robot = new Robot(pathToLookForAdapters, 'shell')
    try{
      await robot.loadAdapter('shell.mjs')
      robot.run()
      // Re-throw AssertionErrors for clearer test failures
      robot.on('error', function (name, err, response) {
        if (err && err.constructor.name === 'AssertionError') {
          throw err
        }
      })
    }catch(e){
      console.error(e)
    }
    const testMessage = `<at>${robot.name}</at> message123`
    const testRegex = /(.*)/
    const pattern = robot.respondPattern(testRegex)
    assert.ok(pattern.test(testMessage))
    const match = testMessage.match(pattern)[1]
    robot.shutdown()
    assert.deepEqual(match, 'message123')
  })
})
