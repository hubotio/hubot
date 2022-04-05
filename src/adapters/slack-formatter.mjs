const MESSAGE_RESERVED_KEYWORDS = ['channel', 'group', 'everyone', 'here']
class SlackFormatter {
  constructor (dataStore, robot) {
    this.dataStore = dataStore
    this.robot = robot
  }

  links (text) {
    this.warnForDeprecation()
    const regex = /<([@#!])?([^>|]+)(?:\\|([^>]+))?>/g

    text = text.replace(regex, (m, type, link, label) => {
      switch (type) {
        case '@': {
          if (label) { return `@${label}` }
          const user = this.dataStore.getUserById(link)
          if (user) {
            return `@${user.name}`
          }
          break
        }
        case '#': {
          if (label) { return `#${label}` }
          const channel = this.dataStore.getChannelById(link)
          if (channel) {
            return `#${channel.name}`
          }
          break
        }
        case '!':
          if (Array.from(MESSAGE_RESERVED_KEYWORDS).includes(link)) {
            return `@${link}`
          } else if (label) {
            return label
          }
          return m

        default:
          link = link.replace(/^mailto:/, '')
          if (label && (link.indexOf(label) === -1)) {
            return `${label} (${link})`
          } else {
            return link
          }
      }
    })

    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&amp;/g, '&')
    return text
  }

  flatten (message) {
    this.warnForDeprecation()
    const text = []
    if (message.text) { text.push(message.text) }
    for (const attachment of Array.from(message.attachments || [])) {
      text.push(attachment.fallback)
    }
    return text.join('\n')
  }

  incoming (message) {
    this.warnForDeprecation()
    return this.links(this.flatten(message))
  }

  warnForDeprecation () {
    if (this.robot) {
      return this.robot.logger.warning('SlackFormatter is deprecated and will be removed in the next major version of ' +
          'hubot-slack. This class was tightly coupled to the now-deprecated dataStore. Formatting functionality has ' +
          'been moved to the SlackTextMessage class. If that class does not suit your needs, please file an issue ' +
          '<https://github.com/slackapi/hubot-slack/issues>'
      )
    }
  }
}
export default SlackFormatter
