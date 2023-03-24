'use strict'
import {User} from '../index.mjs'
import {describe, test, expect} from 'bun:test'
await describe('User', async (t) =>{
  await test('uses id as the default name', async () => {
    const user = new User('hubot')
    expect(user.name).toEqual('hubot')
  })

  await test('sets attributes passed in', async () => {
    const user = new User('hubot', { foo: 1, bar: 2 })
    expect(user.foo).toEqual(1)
    expect(user.bar).toEqual(2)
  })

  await test('uses name attribute when passed in, not id', async () => {
    const user = new User('hubot', { name: 'tobuh' })
    expect(user.name).toEqual('tobuh')
  })
})