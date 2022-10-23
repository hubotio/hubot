'use strict'

import {EventEmitter} from 'events'

class Adapter extends EventEmitter {
  // An adapter is a specific interface to a chat source for robots.
  //
  // robot - A Robot instance.
  constructor (robot) {
    super()
    this.robot = robot
  }

  // Public: Raw method for sending data back to the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns responses from the chat source.
  async send (envelope, ...strings) {}

  // Public: Raw method for sending emote data back to the chat source.
  // Defaults as an alias for send
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns responses from the chat source.
  async emote (envelope, ...strings) {
    return await this.send(envelope, ...strings)
  }

  // Public: Raw method for building a reply and sending it back to the chat
  // source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each reply to send.
  //
  // Returns responses from the chat source.
  async reply (envelope, ...strings) {}

  // Public: Raw method for setting a topic on the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One more more Strings to set as the topic.
  //
  // Returns responses from the chat source.
  async topic (envelope, ...strings) {}

  // Public: Raw method for playing a sound in the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more strings for each play message to send.
  //
  // Returns responses from the chat source.
  async play (envelope, ...strings) {}

  // Public: Raw method for invoking the bot to run. Extend this.
  //
  // Returns nothing.
  run () {}

  // Public: Raw method for shutting the bot down. Extend this.
  //
  // Returns nothing.
  close () {}

  // Public: Dispatch a received message to the robot.
  //
  // Returns nothing.
  async receive (message) {
    await this.robot.receive(message)
  }
}

export default Adapter
