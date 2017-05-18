chai = require 'chai'
{expect} = chai

mockery = require 'mockery'

# Hubot classes
BrainData = require '../src/brain_data.coffee'

describe 'BrainData', ->
  describe 'Unit Tests', ->
    describe 'construction', ->
      it 'turns a nested object into nested BrainDatas', ->
        target = {
          a: {b: 1}
        }
        proxy = BrainData(target)
        expect(proxy.a.__is_braindata__).to.be.true

    describe 'setting attributes', ->
      it 'sets simple attributes on the internal object', ->
        target = {}
        proxy = BrainData(target)
        proxy.x = 1
        expect(target.x).to.equal(1)

      it 'sets object attributes on the internal object', ->
        target = {}
        proxy = BrainData(target)
        proxy.x = {a: 1}
        expect(target.x.a).to.equal(1)

      it 'sets object attributes to BrainData proxies', ->
        target = {}
        proxy = BrainData(target)
        proxy.x = {a: 1}
        expect(target.x.__is_braindata__).to.be.true

      it 'sets array attributes to BrainData proxies', ->
        target = {}
        proxy = BrainData(target)
        proxy.x = [1]
        expect(target.x.__is_braindata__).to.be.true

      it 'deletes attributes from the original object', ->
        target = {x: 1}
        proxy = BrainData(target)
        delete proxy.x
        expect(target.x).to.be.undefined

    describe 'mutation callbacks', ->
      it 'calls a callback when setting a new property', ->
        calls = []
        callback = () -> calls.push Array.prototype.slice.apply(arguments)
        proxy = BrainData({}, callback)
        proxy.x = 1
        expect(calls).to.deep.equal([['x', undefined, 1]])

      it 'calls a callback when changing a property', ->
        calls = []
        callback = () -> calls.push Array.prototype.slice.apply(arguments)
        proxy = BrainData({x: 1}, callback)
        proxy.x = 2
        expect(calls).to.deep.equal([['x', 1, 2]])

      it 'calls a callback when deleting a property', ->
        calls = []
        callback = () -> calls.push Array.prototype.slice.apply(arguments)
        proxy = BrainData({x: 1}, callback)
        delete proxy.x
        expect(calls).to.deep.equal([['x', 1, undefined]])

      it 'calls a callback on initially-extant deeply-nested properties', ->
        calls = []
        callback = () -> calls.push Array.prototype.slice.apply(arguments)
        target = {
          a: { b: 1 }
        }

        proxy = BrainData(target, callback)
        proxy.a.b = 2
        expect(calls).to.deep.equal([['a.b', 1, 2]])

      it 'calls a callback on deeply-nested objects assigned after creation', ->
        calls = []
        callback = (propertyName, previousValue, newValue) ->
          # make a new object so later assignments don't overwrite the record
          copiedValue = JSON.parse(JSON.stringify(newValue))
          calls.push [propertyName, previousValue, copiedValue]
        target = {}

        proxy = BrainData(target, callback)
        proxy.outer = {inner: 1}
        proxy.outer.inner = 2
        expect(calls).to.deep.equal([
          ['outer', undefined, {inner: 1} ],
          [ 'outer.inner', 1, 2 ],
        ])
