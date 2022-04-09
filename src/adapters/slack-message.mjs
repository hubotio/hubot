import { Message, TextMessage } from '../message.mjs'
import SlackMention from './slack-mention.mjs'

class ReactionMessage extends Message {
  constructor (type, user, reaction, itemUser, item, eventTs) {
    super(user)
    this.type = type
    this.reaction = reaction
    this.itemUser = itemUser
    this.item = item
    this.eventTs = eventTs
    this.type = this.type.replace('reaction_', '')
  }
}

class FileSharedMessage extends Message {
  constructor (user, fileId, eventTs) {
    super(user)
    this.fileId = fileId
    this.eventTs = eventTs
  }
}

class PresenceMessage extends Message {
  constructor (users, presence) {
    super({ room: '' })
    this.users = users
    this.presence = presence
  }
}

class SlackTextMessage extends TextMessage {
  constructor (user, text, rawText, rawMessage, channelId, robotName, robotAlias) {
    super(user, text, rawMessage.ts)
    this.rawMessage = rawMessage
    this.channelId = channelId
    this.robotName = robotName
    this.robotAlias = robotAlias
    this.rawText = rawText || this.rawMessage.text
    if (this.rawMessage.threadTs != null) {
      this.threadTs = this.rawMessage.threadTs
    }
    this.mentions = []
  }

  buildText (client, cb) {
    let text = (this.rawMessage.text != null) ? this.rawMessage.text : ''
    if (this.rawMessage.attachments) {
      const attachmentText = this.rawMessage.attachments.map(a => a.fallback).join('\n')
      if (attachmentText.length > 0) { text = text + '\n' + attachmentText }
    }
    const mentionFormatting = this.replaceLinks(client, text)
    const fetchingConversationInfo = client.fetchConversation(this._channel_id)
    return Promise.all([mentionFormatting, fetchingConversationInfo])
      .then(results => {
        const [replacedText, conversationInfo] = Array.from(results)
        text = replacedText
        text = text.replace(/&lt;/g, '<')
        text = text.replace(/&gt;/g, '>')
        text = text.replace(/&amp;/g, '&')

        if (conversationInfo.is_im) {
          const startOfText = text.indexOf('@') === 0 ? 1 : 0
          const robotIsNamed = (text.indexOf(this._robot_name) === startOfText) || (text.indexOf(this._robot_alias) === startOfText)
          if (!robotIsNamed) {
            text = `${this._robot_name} ${text}`
          }
        }

        this.text = text
        return cb()
      }).catch(error => {
        client.robot.logger.error(`An error occurred while building text: ${error.message}`)
        return cb(error)
      })
  }

  replaceLinks (client, text) {
    const regex = SlackTextMessage.MESSAGE_REGEX
    let result = regex.exec(text)
    regex.lastIndex = 0
    let cursor = 0
    const parts = []

    while (result) {
      let [m, type, link, label] = Array.from(result)

      switch (type) {
        case '@':
          if (label) {
            parts.push(text.slice(cursor, result.index), `@${label}`)
            this.mentions.push(new SlackMention(link, 'user', undefined))
          } else {
            parts.push(text.slice(cursor, result.index), this.replaceUser(client, link, this.mentions))
          }
          break

        case '#':
          if (label) {
            parts.push(text.slice(cursor, result.index), `#${label}`)
            this.mentions.push(new SlackMention(link, 'conversation', undefined))
          } else {
            parts.push(text.slice(cursor, result.index), this.replaceConversation(client, link, this.mentions))
          }
          break

        case '!':
          if (Array.from(SlackTextMessage.MESSAGE_RESERVED_KEYWORDS).includes(link)) {
            parts.push(text.slice(cursor, result.index), `@${link}`)
          } else if (label) {
            parts.push(text.slice(cursor, result.index), label)
          } else {
            parts.push(text.slice(cursor, result.index), m)
          }
          break

        default:
          link = link.replace(/^mailto:/, '')
          if (label && (link.indexOf(label) === -1)) {
            parts.push(text.slice(cursor, result.index), `${label} (${link})`)
          } else {
            parts.push(text.slice(cursor, result.index), link)
          }
      }

      cursor = regex.lastIndex
      if (result[0].length === 0) {
        regex.lastIndex++
      }
      result = regex.exec(text)
    }

    parts.push(text.slice(cursor))

    return Promise.all(parts)
      .then(substrings => substrings.join(''))
  }

  replaceUser (client, id, mentions) {
    return client.fetchUser(id)
      .then(res => {
        mentions.push(new SlackMention(res.id, 'user', res))
        return `@${res.name}`
      }).catch(error => {
        client.robot.logger.error(`Error getting user info ${id}: ${error.message}`)
        return `<@${id}>`
      })
  }

  replaceConversation (client, id, mentions) {
    return client.fetchConversation(id)
      .then(conversation => {
        if (conversation != null) {
          mentions.push(new SlackMention(conversation.id, 'conversation', conversation))
          return `#${conversation.name}`
        } else { return `<#${id}>` }
      }).catch(error => {
        client.robot.logger.error(`Error getting conversation info ${id}: ${error.message}`)
        return `<#${id}>`
      })
  }

  static makeSlackTextMessage (user, text, rawText, rawMessage, channelId, robotName, robotAlias, client, cb) {
    const message = new SlackTextMessage(user, text, rawText, rawMessage, channelId, robotName, robotAlias)
    const done = message => setImmediate(() => cb(null, message))
    if (!message.text) {
      return message.buildText(client, function (error) {
        if (error) {
          return cb(error)
        }
        return done(message)
      })
    } else {
      return done(message)
    }
  }
}

SlackTextMessage.MESSAGE_REGEX = /<([@#!])?([^>|]+)(?:\\|([^>]+))?>/g

SlackTextMessage.MESSAGE_RESERVED_KEYWORDS = ['channel', 'group', 'everyone', 'here']

export {
  SlackTextMessage,
  ReactionMessage,
  PresenceMessage,
  FileSharedMessage
}
