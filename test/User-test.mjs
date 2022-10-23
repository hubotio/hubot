'use strict'
import {User} from '../index.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
await test('User', async (t) =>{
  await t.test('uses id as the default name', async () => {
    const user = new User('hubot')
    assert.deepEqual(user.name, 'hubot')
  })

  await t.test('sets attributes passed in', async () => {
    const user = new User('hubot', { foo: 1, bar: 2 })
    assert.deepEqual(user.foo, 1)
    assert.deepEqual(user.bar, 2)
  })

  await t.test('uses name attribute when passed in, not id', async () => {
    const user = new User('hubot', { name: 'tobuh' })
    assert.deepEqual(user.name, 'tobuh')
  })
})