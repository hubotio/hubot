'use strict'

/* global describe, beforeEach, it */

const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))

const expect = chai.expect

const Brain = require('../src/brain')
const InMemoryDataStore = require('../src/datastores/memory')

describe('Datastore', function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers()
    this.robot = {
      emit () {},
      on () {},
      receive: sinon.spy()
    }

    // This *should* be callsArgAsync to match the 'on' API, but that makes
    // the tests more complicated and seems irrelevant.
    sinon.stub(this.robot, 'on').withArgs('running').callsArg(1)

    this.robot.brain = new Brain(this.robot)
    this.robot.datastore = new InMemoryDataStore(this.robot)
    this.robot.brain.userForId('1', {name: 'User One'})
    this.robot.brain.userForId('2', {name: 'User Two'})
  })

  describe('global scope', function () {
    it('returns undefined for values not in the datastore', function () {
      return this.robot.datastore.get('blah').then(function (value) {
        expect(value).to.be.an('undefined')
      })
    })

    it('can store simple values', function () {
      return this.robot.datastore.set('key', 'value').then(() => {
        return this.robot.datastore.get('key').then((value) => {
          expect(value).to.equal('value')
        })
      })
    })

    it('can store arbitrary JavaScript values', function () {
      let object = {
        'name': 'test',
        'data': [1, 2, 3]
      }
      return this.robot.datastore.set('key', object).then(() => {
        return this.robot.datastore.get('key').then((value) => {
          expect(value.name).to.equal('test')
          expect(value.data).to.deep.equal([1, 2, 3])
        })
      })
    })

    it('can dig inside objects for values', function () {
      let object = {
        'a': 'one',
        'b': 'two'
      }
      return this.robot.datastore.set('key', object).then(() => {
        return this.robot.datastore.getObject('key', 'a').then((value) => {
          expect(value).to.equal('one')
        })
      })
    })

    it('can set individual keys inside objects', function () {
      let object = {
        'a': 'one',
        'b': 'two'
      }
      return this.robot.datastore.set('object', object).then(() => {
        return this.robot.datastore.setObject('object', 'c', 'three').then(() => {
          return this.robot.datastore.get('object').then((value) => {
            expect(value.a).to.equal('one')
            expect(value.b).to.equal('two')
            expect(value.c).to.equal('three')
          })
        })
      })
    })

    it('creates an object from scratch when none exists', function () {
      return this.robot.datastore.setObject('object', 'key', 'value').then(() => {
        return this.robot.datastore.get('object').then((value) => {
          let expected = {'key': 'value'}
          expect(value).to.deep.equal(expected)
        })
      })
    })

    it('can append to an existing array', function () {
      return this.robot.datastore.set('array', [1, 2, 3]).then(() => {
        return this.robot.datastore.setArray('array', 4).then(() => {
          return this.robot.datastore.get('array').then((value) => {
            expect(value).to.deep.equal([1, 2, 3, 4])
          })
        })
      })
    })

    it('creates an array from scratch when none exists', function () {
      return this.robot.datastore.setArray('array', 4).then(() => {
        return this.robot.datastore.get('array').then((value) => {
          expect(value).to.deep.equal([4])
        })
      })
    })
  })

  describe('User scope', function () {
    it('has access to the robot object', function () {
      let user = this.robot.brain.userForId('1')
      expect(user._getRobot()).to.equal(this.robot)
    })

    it('can store user data which is separate from global data', function () {
      let user = this.robot.brain.userForId('1')
      return user.set('blah', 'blah').then(() => {
        return user.get('blah').then((userBlah) => {
          return this.robot.datastore.get('blah').then((datastoreBlah) => {
            expect(userBlah).to.not.equal(datastoreBlah)
            expect(userBlah).to.equal('blah')
            expect(datastoreBlah).to.be.an('undefined')
          })
        })
      })
    })

    it('stores user data separate per-user', function () {
      let userOne = this.robot.brain.userForId('1')
      let userTwo = this.robot.brain.userForId('2')
      return userOne.set('blah', 'blah').then(() => {
        return userOne.get('blah').then((valueOne) => {
          return userTwo.get('blah').then((valueTwo) => {
            expect(valueOne).to.not.equal(valueTwo)
            expect(valueOne).to.equal('blah')
            expect(valueTwo).to.be.an('undefined')
          })
        })
      })
    })
  })
})
