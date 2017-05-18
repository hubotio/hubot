# A BrainData is a proxy/wrapper around a regular ol' object. It ensures that
# any nested members of the object are also proxied to BrainData. The given
# callback will be notified of any changes to the internal data. The callback
# will receive three arguments: property, previousValue, and newValue.
BrainData = (target, callback) ->
  return target unless typeof target == 'object'

  handler = {
    set: (target, property, value) ->
      if callback
        callback(property, target[property], value)
      target[property] = BrainData(value, prependProperty(property, callback))

    get: (target, property, receiver) ->
      # this __is_braindata__ attribute is here so the tests can assert that
      # the proxies have been applied correctly, since Proxies are invisible
      # to instanceof and typeof.
      if property == '__is_braindata__'
        true
      else
        target[property]

    deleteProperty: (target, property) ->
      if callback
        callback(property, target[property], undefined)
      delete target[property]
  }

  for own property, value of target
    target[property] = BrainData(target[property], prependProperty(property, callback))

  new Proxy(target, handler)

# callback wrapper for deeply-nested objects. Given a brain that looks like
# {
#   users: {
#     ashton: { lastName: "kutcher" }
#   }
# }
# if someone calls robot.brain.data.users.ashton.lastName = "moore",
# the wrapper ensures the callback is called with "users.ashton.lastName"
# as the first argument, rather than just "lastName".
prependProperty = (property, callback) ->
  (subProperty, previousValue, newValue) ->
    callback("#{property}.#{subProperty}", previousValue, newValue)

module.exports = BrainData
