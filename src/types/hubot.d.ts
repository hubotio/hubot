declare module 'hubot' {
  export class Robot {
    name: string;
    brain: Brain;
    adapter: Adapter;
    alias: string | boolean;
    logger: any;
    router: any;
    events: any;
    Response: typeof Response;
    commands: string[];
    listeners: Listener[];
    middleware: {
      listener: Middleware;
      response: Middleware;
      receive: Middleware;
    };

    constructor(adapter: string | object | null, httpd: boolean, name?: string, alias?: string);
    
    hear(regex: RegExp, callback: (res: Response) => Promise<void>): void;
    respond(regex: RegExp, callback: (res: Response) => Promise<void>): void;
    enter(callback: (res: Response) => Promise<void>): void;
    leave(callback: (res: Response) => Promise<void>): void;
    topic(callback: (res: Response) => Promise<void>): void;
    error(callback: (err: Error, res?: Response) => void): void;
    catchAll(callback: (res: Response) => Promise<void>): void;
  }

  export class Response {
    robot: Robot;
    message: Message;
    envelope: Envelope;
    constructor(robot: Robot, message: Message, match?: RegExpMatchArray);
    send(...strings: string[]): Promise<void>;
    reply(...strings: string[]): Promise<void>;
    random<T>(items: T[]): T;
  }

  export class Message {
    user: User;
    room: string;
    text?: string;
    id: string;
    done: boolean;
    constructor(user: User, done?: boolean);
  }

  export class Brain {
    data: { [key: string]: any };
    constructor(robot: Robot);
    set<T>(key: string, value: T): void;
    get<T>(key: string): T | undefined;
    remove(key: string): void;
    save(): void;
    close(): void;
  }

  export class User {
    id: string;
    name: string;
    room: string;
    constructor(id: string, options?: object);
  }

  export interface Envelope {
    room: string;
    user?: User;
    message?: Message;
  }

  export class Listener {
    robot: Robot;
    matcher: (message: Message) => boolean | RegExpMatchArray;
    callback: (response: Response) => Promise<void>;
    options: object;
    constructor(robot: Robot, matcher: (message: Message) => boolean | RegExpMatchArray, options: object, callback: (response: Response) => Promise<void>);
  }

  export class Middleware {
    robot: Robot;
    constructor(robot: Robot);
    register(middleware: (context: any) => Promise<boolean>): void;
    execute(context: any): Promise<boolean>;
  }

  export class EnterMessage extends Message {}
  export class LeaveMessage extends Message {}
  export class TopicMessage extends Message {}
  export class CatchAllMessage extends Message {}
  export class TextMessage extends Message {}
}
