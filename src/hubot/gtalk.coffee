Robot = require '../robot'
Xmpp = require 'simple-xmpp'

class Gtalkbot extends Robot
  run: ->
    # Connect to gtalk servers
    new Xmpp.connect
      jid: process.env.HUBOT_GTALK_USERNAME
      password: process.env.HUBOT_GTALK_PASSWORD
      host: 'talk.google.com'
      port: 5222

    # Events
    Xmpp.on 'online', @.online
    Xmpp.on 'chat', @.chat
    Xmpp.on 'error', @.error
    
    # Log options
    #console.log options
	 
  online: =>
    console.log 'Hubot is online, talk.google.com!'

  chat: (from,message) =>
    @receive new Robot.TextMessage from, message
  
  send: (user, strings...) ->
    for str in strings
      Xmpp.send user, str

  reply: (user, strings...) ->
    for str in strings
      @send user.name, "#{str}"

  error: (err) =>
    console.error err

module.exports = Gtalkbot