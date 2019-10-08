const Path = require('path')
const {Adapter, EnterMessage, LeaveMessage, TopicMessage} = require.main.require(Path.resolve(__dirname, '../../index.js'))
const {SlackTextMessage, ReactionMessage, PresenceMessage, FileSharedMessage} = require('./slack-message.js')
const SlackClient = require('./slack-client.js')
const pkg = require('../../package.json')

class SlackBot extends Adapter {
  constructor (robot, options) {
    super(robot)
    // this.open = this.open.bind(this)
    // this.authenticated = this.authenticated.bind(this)
    // this.presenceSub = this.presenceSub.bind(this)
    // this.close = this.close.bind(this)
    // this.error = this.error.bind(this)
    // this.eventHandler = this.eventHandler.bind(this)
    // this.usersLoaded = this.usersLoaded.bind(this)
    this.id = null
    this.bot_id = null
    this.options = options
    this.robot.logger.info(`hubot-slack adapter v${pkg.version}`)
    this.client = new SlackClient(this.options, this.robot)
  }

  run () {
    let needle = null
    if (!this.options.token) { return this.robot.logger.error('No token provided to Hubot') }
    if ((needle = this.options.token.substring(0, 5), !['xoxb-', 'xoxp-'].includes(needle))) { return this.robot.logger.error('Invalid token provided, please follow the upgrade instructions') }

    this.client.rtm.on('open', this.open.bind(this))
    this.client.rtm.on('close', this.close.bind(this))
    this.client.rtm.on('error', this.error.bind(this))
    this.client.rtm.on('authenticated', this.authenticated.bind(this))
    this.client.onEvent(this.eventHandler.bind(this))

    // TODO: set this to false as soon as RTM connection closes (even if reconnect will happen later)
    // TODO: check this value when connection finishes (even if its a reconnection)
    // TODO: build a map of enterprise users and local users
    this.needsUserListSync = true
    if (!this.options.disableUserSync) {
      this.client.loadUsers(this.usersLoaded)
    } else {
      this.brainIsLoaded = true
    }

    this.robot.brain.on('loaded', () => {
      if (!this.brainIsLoaded) {
        this.brainIsLoaded = true
        // The following code should only run after the first time the brain connects to its storage

        // There's a race condition where the connection can happen after the above `@client.loadUsers` call finishes,
        // in which case the calls to save users in `@usersLoaded` would not persist. It is still necessary to call the
        // method there in the case Hubot is running without brain storage.
        // NOTE: is this actually true? won't the brain have the users in memory and persist to storage as soon as the
        // connection is complete?
        // NOTE: this seems wasteful. when there is brain storage, it will end up loading all the users twice.
        this.client.loadUsers(this.usersLoaded)
        this.isLoaded = true
        // NOTE: will this only subscribe a partial user list because loadUsers has not yet completed? it will at least
        // subscribe to the users that were stored in the brain from the last run.
        return this.presenceSub()
      }
    })
    return this.client.connect()
  }
  async send (envelope, ...messages) {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i] !== '') await this.client.send(envelope, messages[i])
    }
  }
  async reply (envelope, ...messages) {
    for (let i = 0; i < messages.length; i++) {
      let message = messages[i]
      if (message === '') continue
      if (envelope.room[0] !== 'D') {
        message = `<@${envelope.user.id}>: ${message}`
      }
      await this.client.send(envelope, message)
    }
  }

  setTopic (envelope, ...strings) {
    // TODO: if the sender is interested in the completion, the last item in `messages` will be a function
    // TODO: this will fail if sending an object as a value in strings
    return this.client.setTopic(envelope.room, strings.join('\n'))
  }
  open () {
    this.robot.logger.info('Connected to Slack RTM')
    return this.emit('connected')
  }
  authenticated (identity) {
    if (identity.users) {
      for (let user of Array.from(identity.users)) {
        if (user.id === identity.self.id) {
          this.robot.logger.debug('SlackBot#authenticated() Found self in RTM start data')
          this.bot_id = user.profile.bot_id
          break
        }
      }
    }
    this.robot.name = identity.self.name
    this.id = identity.self.id
    this.emit('connected')
    return this.robot.logger.info(`Logged in as @${this.robot.name} in workspace ${identity.team.name}`)
  }
  presenceSub () {
    const ids = (() => {
      const result = []
      for (let id of Object.keys(this.robot.brain.data.users || {})) {
        const user = this.robot.brain.data.users[id]
        if (!user.is_bot && !user.deleted) {
          result.push(id)
        }
      }
      return result
    })()
    this.robot.logger.debug(`SlackBot#presenceSub() Subscribing to presence for ${ids.length} users`)
    return this.client.rtm.subscribePresence(ids)
  }

  close () {
    this.robot.logger.info('Disconnected from Slack RTM')
    // NOTE: not confident that @options.autoReconnect works
    if (this.options.autoReconnect) {
      return this.robot.logger.info('Waiting for reconnect...')
    } else {
      this.robot.logger.info('Exiting...')
      this.client.disconnect()
      // NOTE: Node recommends not to call process.exit() but Hubot itself uses this mechanism for shutting down
      // Can we make sure the brain is flushed to persistence? Do we need to cleanup any state (or timestamp anything)?
      return process.exit(1)
    }
  }
  error (error) {
    this.robot.logger.error(`Slack RTM error: ${JSON.stringify(error)}`)
    // Assume that scripts can handle slowing themselves down, all other errors are bubbled up through Hubot
    // NOTE: should rate limit errors also bubble up?
    if (error.code !== -1) {
      return this.robot.emit('error', error)
    }
  }
  eventHandler (event) {
    const {user, channel} = event
    const isFromThisBot = (user != null ? user.id : undefined) === this.id
    if (isFromThisBot) {
      return
    }
    if (event.type === 'message') {
      user.room = (channel != null) ? channel : ''
      switch (event.subtype) {
        case 'bot_message':
          this.robot.logger.debug(`Received text message in channel: ${channel}, from: ${user.id} (bot)`)
          return SlackTextMessage.makeSlackTextMessage(user, undefined, undefined, event, channel, this.robot.name, this.robot.alias, this.client, (error, message) => {
            if (error) { return this.robot.logger.error(`Dropping message due to error ${error.message}`) }
            return this.receive(message)
          })
        case 'channel_topic': case 'group_topic':
          this.robot.logger.debug(`Received topic change message in conversation: ${channel}, new topic: ${event.topic}, set by: ${user.id}`)
          return this.receive(new TopicMessage(user, event.topic, event.ts))
        case undefined:
          this.robot.logger.debug(`Received text message in channel: ${channel}, from: ${user.id} (human)`)
          return SlackTextMessage.makeSlackTextMessage(user, undefined, undefined, event, channel, this.robot.name, this.robot.alias, this.client, (error, message) => {
            if (error) {
              return this.robot.logger.error(`Dropping message due to error ${error.message}`)
            }
            return this.receive(message)
          })
      }
    } else if (event.type === 'member_joined_channel') {
      user.room = channel
      this.robot.logger.debug(`Received enter message for user: ${user.id}, joining: ${channel}`)
      return this.receive(new EnterMessage(user))
    } else if (event.type === 'member_left_channel') {
      user.room = channel
      this.robot.logger.debug(`Received leave message for user: ${user.id}, joining: ${channel}`)
      return this.receive(new LeaveMessage(user))
    } else if ((event.type === 'reaction_added') || (event.type === 'reaction_removed')) {
      // Once again Hubot expects all user objects to have a room property that is used in the envelope for the message
      // after it is received. If the reaction is to a message, then the `event.item.channel` contain a conversation ID.
      // Otherwise reactions can be on files and file comments, which are "global" and aren't contained in a
      // conversation. In that situation we fallback to an empty string.
      user.room = event.item.type === 'message' ? event.item.channel : ''

      // Reaction messages may contain an `event.itemUser` property containing a fetched SlackUserInfo object. Before
      // the message is received by Hubot, turn that data into a Hubot User object.
      const itemUser = (event.itemUser != null) ? this.robot.brain.userForId(event.itemUser.id, event.itemUser) : {}

      this.robot.logger.debug(`Received reaction message from: ${user.id}, reaction: ${event.reaction}, item type: ${event.item.type}`)
      return this.receive(new ReactionMessage(event.type, user, event.reaction, itemUser, event.item, event.event_ts))
    } else if (event.type === 'presence_change') {
      // Collect all Hubot User objects referenced in this presence change event
      // NOTE: this does not create new Hubot User objects for any users that are not already in the brain. It should
      // not be possible for this to happen since Slack will only send events for users where an explicit subscription
      // was made. In the `presenceSub()` method, subscriptions are only made for users in the brain.
      const users = (() => {
        const result = []
        for (let userId of Array.from((event.users || [event.user.id]))) {
          if (this.robot.brain.data.users[userId] != null) {
            result.push(this.robot.brain.data.users[userId])
          }
        }
        return result
      })()

      this.robot.logger.debug(`Received presence update message for users: ${Array.from(users).map((u) => u.id)} with status: ${event.presence}`)
      return this.receive(new PresenceMessage(users, event.presence))
    } else if (event.type === 'file_shared') {
      // Once again Hubot expects all user objects to have a room property that is used in the envelope for the message
      // after it is received. If the reaction is to a message, then the `event.item.channel` contain a conversation ID.
      // Otherwise reactions can be on files and file comments, which are "global" and aren't contained in a
      // conversation. In that situation we fallback to an empty string.
      user.room = event.channel_id

      this.robot.logger.debug(`Received file_shared message from: ${user.id}, file_id: ${event.file_id}`)
      return this.receive(new FileSharedMessage(user, event.file_id, event.event_ts))
    }
  }
  usersLoaded (err, res) {
    if (err || !res.members.length) {
      this.robot.logger.error("Can't fetch users")
      return
    }
    return Array.from(res.members).map((member) => this.client.updateUserInBrain(member))
  }
}

module.exports = SlackBot
