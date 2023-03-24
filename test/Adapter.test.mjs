'use strict'
import {Adapter, Robot, TextMessage} from '../index.mjs'
import {describe, test, expect} from 'bun:test'

describe('Adapter', ()=>{
  test('dispatches received messages to the robot', async () => {
    const robot = new Robot()
    robot.listen(()=>true, {id: 1}, res=>{
      expect(res.message.text).toEqual('testing')
      expect(res.message.room).toEqual('testing')
      robot.shutdown()
    })
    const adapter = new Adapter(robot)
    const message = new TextMessage({room: 'testing'}, 'testing', 1, null)
    await adapter.receive(message)
  })
})