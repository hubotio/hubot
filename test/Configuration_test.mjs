'use strict'

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Robot } from '../index.mjs'
import { resolve } from 'node:path'
describe('Configuration', () => {
  describe('#robot', () => {
    let robot = null
    beforeEach(() => {
      robot = new Robot(null, false, 'TestHubot')
    })
    afterEach(() => {
      robot.shutdown()
    })
    it('Load files from configuration folder', async () => {
      await robot.load(resolve('.', 'configuration'))
      assert.ok(robot.config !== undefined)
    })
  })
})
