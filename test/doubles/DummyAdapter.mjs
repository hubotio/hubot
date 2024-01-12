'use strict'
// Replace this with import { Adapter, TextMessage } from 'hubot'
import { Adapter, TextMessage } from '../../index.mjs'

export class DummyAdapter extends Adapter {
  constructor (robot) {
    super(robot)
    this.name = 'DummyAdapter'
    this.messages = new Set()
  }

  async send (envelope, ...strings) {
    this.emit('send', envelope, ...strings)
    this.robot.emit('send', envelope, ...strings)
  }

  async reply (envelope, ...strings) {
    this.emit('reply', envelope, ...strings)
    this.robot.emit('reply', envelope, ...strings)
  }

  async topic (envelope, ...strings) {
    this.emit('topic', envelope, ...strings)
    this.robot.emit('topic', envelope, ...strings)
  }

  async play (envelope, ...strings) {
    this.emit('play', envelope, ...strings)
    this.robot.emit('play', envelope, ...strings)
  }

  run () {
    // This is required to get the scripts loaded
    this.emit('connected')
  }

  close () {
    this.emit('closed')
  }

  async say (user, message, room) {
    this.messages.add(message)
    user.room = room
    await this.robot.receive(new TextMessage(user, message))
  }
}
export default {
  use (robot) {
    return new DummyAdapter(robot)
  }
}
