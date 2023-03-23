'use strict'
import {Robot} from '../index.mjs'
import {describe, it, expect} from 'bun:test'

describe('Name Matching', () => {
  it('matches messages starting with robot\'s name but wrapped in html', async () => {
    const robot = new Robot('../test/fixtures/shell.mjs')
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
    expect(pattern.test(testMessage)).to.be.true
    const match = testMessage.match(pattern)[1]
    robot.shutdown()
    expect(match).to.equal('message123')
  })
})
