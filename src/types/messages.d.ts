declare module 'hubot' {
  export class EnterMessage extends Message {
    constructor(user: User);
  }

  export class LeaveMessage extends Message {
    constructor(user: User);
  }

  export class TopicMessage extends Message {
    constructor(user: User, text: string, oldTopic: string);
  }

  export class CatchAllMessage extends Message {
    constructor(message: Message);
  }

  export class TextMessage extends Message {
    constructor(user: User, text: string, id?: string);
  }
}
