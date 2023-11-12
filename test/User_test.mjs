'use strict'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { User } from '../index.mjs'

describe('User', () =>
  describe('new', function () {
    it('uses id as the default name', function () {
      const user = new User('hubot')

      assert.equal(user.name, 'hubot', 'User constructor should set name')
    })

    it('sets attributes passed in', function () {
      const user = new User('hubot', { foo: 1, bar: 2 })

      assert.equal(user.foo, 1, 'Passing an object with attributes in the User constructor should set those attributes on the instance.')
      assert.equal(user.bar, 2, 'Passing an object with attributes in the User constructor should set those attributes on the instance.')
    })

    it('uses name attribute when passed in, not id', function () {
      const user = new User('hubot', { name: 'tobuh' })

      assert.equal(user.name, 'tobuh', 'Passing a name attribute in the User constructor should set the name attribute on the instance.')
    })
  })
)
