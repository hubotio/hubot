'use strict'

/* global describe, it */

const expect = require('chai').expect
const User = require('../src/user')

describe('User', () =>
  describe('new', function () {
    it('uses id as the default name', function () {
      const user = new User('botforge')

      expect(user.name).to.equal('botforge')
    })

    it('sets attributes passed in', function () {
      const user = new User('botforge', { foo: 1, bar: 2 })

      expect(user.foo).to.equal(1)
      expect(user.bar).to.equal(2)
    })

    it('uses name attribute when passed in, not id', function () {
      const user = new User('botforge', { name: 'tobuh' })

      expect(user.name).to.equal('tobuh')
    })
  })
)
