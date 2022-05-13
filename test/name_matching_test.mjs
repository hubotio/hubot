'use strict'

/* global describe, beforeEach, it, afterEach */
/* eslint-disable no-unused-expressions */

// Assertions and Stubbing
import chai from 'chai'
import cs from 'sinon-chai'
import Robot from '../src/robot.mjs'
import { fileURLToPath } from 'url'
import path from 'path'

chai.use(cs)

const expect = chai.expect

describe('Name Matching', function () {
    beforeEach(async function() {
        let pathToLookForAdapters = fileURLToPath(import.meta.url).replace('/test/name_matching_test.mjs', '')
        pathToLookForAdapters = path.resolve(pathToLookForAdapters, 'test/fixtures')
        this.robot = new Robot(pathToLookForAdapters, 'shell', 'TestHubot', 'Hubot', 0)
        await this.robot.setupExpress()
        try{
          await this.robot.loadAdapter('shell.mjs')
          this.robot.run()
          // Re-throw AssertionErrors for clearer test failures
          this.robot.on('error', function (name, err, response) {
            if (err && err.constructor.name === 'AssertionError') {
              throw err
            }
          })
          this.user = this.robot.brain.userForId('1', {
            name: 'hubottester',
            room: '#mocha'
          })
        }catch(e){
          console.error(e)
        }
      })
    
      afterEach(function (done) {
        this.robot.shutdown()
        done()
      })
      describe('Matching', function () {
        it('matches messages starting with robot\'s name but wrapped in html', function () {
            const testMessage = `<at>${this.robot.name}</at> message123`
            const testRegex = /(.*)/
            const pattern = this.robot.respondPattern(testRegex)
            expect(testMessage).to.match(pattern)
            const match = testMessage.match(pattern)[1]
            expect(match).to.equal('message123')
        })
    })
})