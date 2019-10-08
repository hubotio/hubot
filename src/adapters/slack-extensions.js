const Path = require('path')
const {Robot} = require.main.require(Path.resolve(__dirname, '../../index.js'))
const {ReactionMessage, PresenceMessage, FileSharedMessage} = require('./slack-message.js')

Robot.prototype.hearReaction = function (matcher, options, callback) {
  let matchReaction = msg => msg instanceof ReactionMessage
  if (!options && !callback) {
    return this.listen(matchReaction, matcher)
  } else if (matcher instanceof Function) {
    matchReaction = msg => msg instanceof ReactionMessage && matcher(msg)
  } else {
    callback = options
    options = matcher
  }
  return this.listen(matchReaction, options, callback)
}

Robot.prototype.presenceChange = function (matcher, options, callback) {
  let matchPresence = msg => msg instanceof PresenceMessage
  if (arguments.length === 1) {
    return this.listen(matchPresence, matcher)
  } else if (matcher instanceof Function) {
    matchPresence = msg => msg instanceof PresenceMessage && matcher(msg)
  } else {
    callback = options
    options = matcher
  }

  return this.listen(matchPresence, options, callback)
}

Robot.prototype.fileShared = function (matcher, options, callback) {
  let matchFileShare = msg => msg instanceof FileSharedMessage
  if (!options && !callback) {
    return this.listen(matchFileShare, matcher)
  } else if (matcher instanceof Function) {
    matchFileShare = msg => msg instanceof FileSharedMessage && matcher(msg)
  } else {
    callback = options
    options = matcher
  }

  return this.listen(matchFileShare, options, callback)
}
