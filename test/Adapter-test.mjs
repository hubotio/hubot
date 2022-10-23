'use strict'
import {Adapter, Robot, TextMessage} from '../index.mjs'
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

describe('Adapter', ()=>{
  it('dispatches received messages to the robot', async () => {
    const robot = new Robot()
    robot.listen(()=>true, {id: 1}, res=>{
      assert.deepEqual('testing', res.message.text)
      assert.deepEqual('testing', res.message.room)
      robot.shutdown()
    })
    const adapter = new Adapter(robot)
    const message = new TextMessage({room: 'testing'}, 'testing', 1, null)
    await adapter.receive(message)
  })
})