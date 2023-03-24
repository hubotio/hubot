'use strict'
import assert from 'node:assert/strict'
import {describe, expect, test, beforeEach, afterEach} from 'bun:test'
import { Robot, TextListener, CatchAllMessage, User, EnterMessage, LeaveMessage, TextMessage, TopicMessage } from '../index.mjs'
import {URL} from 'node:url'

const __dirname = new URL('.', import.meta.url).pathname
const domain = '127.0.0.1'

const BEG = `\x1b[`
const END = `\x1b[0m`
const log = function(){
  console.log(`${BEG}32;49m[${new Date()} robot-test]${END}`, ...arguments)
}

let robot = null
let user = null


describe('Robot', async () => {

  beforeEach(async () => {
    console.log('***** creating a Robot')
    robot = new Robot('../test/fixtures/shell.mjs', 'TestHubot', 'Hubot')
    await robot.setupExpress(0)
    try{
      await robot.loadAdapter('../test/fixtures/shell.mjs')
      robot.run()
      // Re-throw AssertionErrors for clearer test failures
      robot.on('error', function (name, err, response) {
        if (err && err.constructor.name === 'AssertionError') {
          throw err
        }
      })
      user = robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      })
    }catch(e){
      console.error(e)
    }
  })
  
  afterEach(async () => {
    robot.shutdown()
  })
  
  await describe('#http', async () => {
    await test('persists the url passed in', async () => {
      const url = `http://${domain}`
      const httpClient = robot.http(url)
      expect(httpClient.url).toEqual(url)
    })

    await test('actually responds to an http get request', async () => {
      const url = `http://${domain}:${robot.port}`
      const httpClient = robot.http(url)
      robot.router.get('/', (req, res) => {
        res.end()
      })

      const response = await httpClient.get()
      expect(response.error).toEqual(null)
      expect(response.body).toEqual('')
      expect(response.res.headers['x-powered-by']).toEqual(`hubot/${robot.name}`)
    })

    await test('actually does a post', async () => {
      const url = `http://${domain}:${robot.port}/1`
      const httpClient = robot.http(url, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      robot.router.post('/:id', (req, res) => {
        assert.deepEqual(req.params.id, '1')
        assert.deepEqual(req.body.name, 'jg')
        res.json(req.body)
      })
      const response = await httpClient.post('name=jg')
      expect(response.error).toEqual(null)
      expect(response.res.statusCode).toEqual(200)
      expect(JSON.parse(response.body).name).toEqual('jg')
    })

    await test('passes options through to the ScopedHttpClient', async () => {
      const agent = {}
      const httpClient = robot.http(`http://${domain}`, { agent })
      expect(httpClient.options.agent).toEqual(agent)
    })

    await test('sets a sane user agent', async () => {
      const agent = {}
      const httpClient = robot.http(`http://${domain}`, { agent })
      expect(httpClient.options.headers['User-Agent'].indexOf('Hubot')).toBeGreaterThan(-1)
    })

    await test('merges in any global http options', async () => {
      const agent = {}
      robot.globalHttpOptions = { agent }
      const httpClient = robot.http(`http://${domain}`)
      expect(httpClient.options.agent).toEqual(agent)
    })

    await test('local options override global http options', async () => {
      const agentA = {}
      const agentB = {}
      robot.globalHttpOptions = { agent: agentA }
      const httpClient = robot.http(`http://${domain}`, { agent: agentB })
      expect(httpClient.options.agent).toEqual(agentB)
    })
  })
  
  await describe('#respondPattern', async () => {
    await test('matches messages starting with robot\'s name', async () => {
      const testMessage = robot.name + 'message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      expect(pattern.test(testMessage)).toEqual(true)
      const match = testMessage.match(pattern)[1]
      expect(match).toEqual('message123')
    })

    await test('matches messages starting with robot\'s alias', async () => {
      const testMessage = robot.alias + 'message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      expect(pattern.test(testMessage)).toEqual(true)
      const match = testMessage.match(pattern)[1]
      expect(match).toEqual('message123')
    })

    await test('does not match unaddressed messages', async () => {
      const testMessage = 'message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      expect(pattern.test(testMessage)).toEqual(false)
    })

    await test('matches properly when name is substring of alias', async () => {
      robot.name = 'Meg'
      robot.alias = 'Megan'
      const testMessage1 = robot.name + ' message123'
      const testMessage2 = robot.alias + ' message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      expect(pattern.test(testMessage1)).toEqual(true)
      
      const match1 = testMessage1.match(pattern)[1]
      expect(match1).toEqual('message123')
      expect(pattern.test(testMessage2)).toEqual(true)
      
      const match2 = testMessage2.match(pattern)[1]
      expect(match2).toEqual('message123')
    })

    await test('matches properly when alias is substring of name', async () => {
      robot.name = 'Megan'
      robot.alias = 'Meg'
      const testMessage1 = robot.name + ' message123'
      const testMessage2 = robot.alias + ' message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      expect(pattern.test(testMessage1)).toEqual(true)
      
      const match1 = testMessage1.match(pattern)[1]
      expect(match1).toEqual('message123')
      expect(pattern.test(testMessage2)).toEqual(true)
      
      const match2 = testMessage2.match(pattern)[1]
      expect(match2).toEqual('message123')
    })
  })

  await describe('#listen', async () => {
    await test('registers a new listener directly', async () => {
      expect(robot.listeners.size).toEqual(0)
      robot.listen(() => {}, () => {})
      expect(robot.listeners.size).toEqual(1)
    })
  })

  await describe('#hear', async () => {
    await test('registers a new listener directly', async () =>  {
      expect(robot.listeners.size).toEqual(0)
      
      robot.hear(/.*/, () => {})
      expect(robot.listeners.size).toEqual(1)
    })
  })

  await describe('#respond', async () => {
    await test('registers a new listener using hear', async () => {
      robot.respond(/.*/, ()=>{})
      expect(robot.listeners.size).toEqual(1)
      expect(Array.from(robot.listeners)[0] instanceof TextListener).toEqual(true)
    })
  })

  await describe('#room messages', async () => {
    await test('Enter', async () => {
      robot.enter((message, listener, callback)=>{
        expect(message instanceof EnterMessage).toEqual(true)
      })
      await robot.receive(new EnterMessage(new User(1), null, ()=>{}))
    })
    await test('Leave', async () => {
      robot.leave((message, listener, callback)=>{
        expect(message instanceof LeaveMessage).toEqual(true)
      })
      await robot.receive(new LeaveMessage(new User(1), null, ()=>{}))
    })
    await test('Topic', async () => {
      robot.topic((message, listener, callback)=>{
        expect(message instanceof TopicMessage).toEqual(true)
      })
      await robot.receive(new TopicMessage(new User(1), null, ()=>{}))
    })
    await test('matches EnterMessages', async () => {
      const testMessage = new EnterMessage(new User(1))
      robot.enter(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeTruthy()
    })

    await test('does not match TextMessages', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.enter(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeFalsy()
    })

    await test('does not match TextMessages', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.leave(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeFalsy()
    })

    await test('does not match TextMessages', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.topic(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeFalsy()
    })
  })

  await describe('#receive', async () => {
    await test('Catch all', async () => {
      const testMessage = new TextMessage(new User(1, {room: '#testing'}), 'message123')
      robot.catchAll((message, listener, callback)=>{
        expect(message instanceof CatchAllMessage).toEqual(true)
      })
      await robot.receive(new CatchAllMessage(testMessage, null, ()=>{}))
    })

    await test('does not trigger a CatchAllMessage if a listener matches', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.listen(message => true, async response => {
        console.log('shouldnt be here')
        expect(message).toEqual(testMessage)
      })
      robot.catchAll(expect.not.toHaveBeenCalled(response => {}))
      await robot.receive(testMessage)
    })

    await test('stops processing if a listener marks the message as done', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.listen(message => true, async response => {
        response.message.done = true
        expect(response.message.done).toEqual(true)
      })
      robot.listen(message => true, expect(async response => {}).not.toHaveBeenCalled())
      await robot.receive(testMessage)
    })
  })

  await describe('#error handling', async () => {
    await test('gracefully handles listener uncaughtExceptions (move on to next listener)', async () => {
      const testMessage = {}
      const theError = new Error('Fake error')
      let goodListenerCalled = false
      robot.listen(message => true, async response => {
        throw theError
      })
      robot.listen(message => true, async response => {
        goodListenerCalled = true
        expect(goodListenerCalled).toEqual(true)
      })
      robot.on(Robot.EVENTS.ERROR, (err, message)=>{
        expect(err).toBe(theError)
        expect(message).toBe(testMessage)
      })

      await robot.receive(testMessage)
      expect(goodListenerCalled).toEqual(true)
    })
  })

  await describe('#loadFile', async () => {
    await test('should load .mjs files in the scripts folder', async ()=> {
      const module = await robot.loadMjsFile(`${__dirname}scripts/test-script.mjs`)
      expect(typeof module.default).toEqual('function')
    })
  })

  await describe('#send', async () => {
    await test('delegates to adapter "send" with proper context', async () => {
      robot.adapter.on('send', (envelope, ...strings)=>{
        expect(strings[0]).toEqual('test message')
      })
      await robot.send({}, 'test message')
    })
  })

  await describe('#reply', async () => {
    await test('delegates to adapter "reply" with proper context', async () => {
      robot.adapter.on('reply', (envelope, ...strings)=>{
        expect(strings[0]).toEqual('test message')
      })
      await robot.reply({}, 'test message')
    })

    await test('passes an adapater context through so that custom adapaters have access to their stuff', async () => {
      robot.on('error', expect((err)=>{}).not.toHaveBeenCalled())
      const testMessage = new TextMessage(new User(1, {
        room: '#adaptertest'
      }), 'TestHubot test adapater context', 1, {
        async adapterSendMethod(arg){
          expect(arg).toEqual('test adapater context')
        }
      })
      robot.respond(/test/, async resp => {
        await resp.message.adapterContext.adapterSendMethod('test adapater context')
      })
      await robot.receive(testMessage)
    })
  })

  await describe('#messageRoom', async () => {
    await test('delegates to adapter "send" with proper context', async () => {
      robot.adapter.on('send', expect(()=>{}).toHaveBeenCalled())
      robot.messageRoom('testRoom', 'messageRoom test')
    })
  })

  await describe('#hear', async () => {
    await test('matches TextMessages', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.hear(/^message123$/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeTruthy()
    })

    await test('does not match EnterMessages', async () =>  {
      const testMessage = new EnterMessage(new User(1))
      robot.hear(/.*/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeUndefined()
    })
  })

  await describe('#respond', async () => {
    await test('matches TextMessages addressed to the robot', () => {
      const testMessage = new TextMessage(new User(1), 'TestHubot message123')
      robot.respond(/message123$/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeTruthy()
    })

    await test('does not match EnterMessages', () => {
      const testMessage = new EnterMessage(new User(1))
      robot.respond(/.*/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeUndefined()
    })
  })

  await describe('#catchAll', async () => {
    await test('matches CatchAllMessages', async () => {
      const testMessage = new CatchAllMessage(new TextMessage(new User(1), 'message123'))
      robot.catchAll(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toBeTruthy()
    })

    await test('does not match TextMessages', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.catchAll(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      expect(result).toEqual(false)
    })
  })

  await describe('Message Processing', async () => {
    await test('calls a matching listener', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.hear(/^message123$/, response => {
        expect(response.message).toEqual(testMessage)
      })
      await robot.receive(testMessage)
    })

    await test('calls multiple matching listeners', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      let listenersCalled = 0
      const listenerCallback = response => {
        expect(response.message).toEqual(testMessage)
        listenersCalled++
      }

      robot.hear(/^message123$/, listenerCallback)
      robot.hear(/^message123$/, listenerCallback)

      await robot.receive(testMessage)
      expect(listenersCalled).toEqual(2)
    })

    await test('calls the catch-all listener if no listeners match', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      const listenerCallback = ()=> expect(()=>{}).not.toHaveBeenCalled()
      robot.hear(/^no-matches$/, listenerCallback)
      
      robot.catchAll(response => {
        expect(response.message).toEqual(testMessage)
      })
      await robot.receive(testMessage)
    })

    await test('does not call the catch-all listener if any listener matched', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      let counter = 0
      const listenerCallback = ()=>{
        counter++
        expect(counter).toEqual(1)
      }
      robot.hear(/^message123$/, listenerCallback)
      const catchAllCallback = ()=>expect(()=>{}).not.toHaveBeenCalled()
      robot.catchAll(catchAllCallback)
      await robot.receive(testMessage)
    })

    await test('stops processing if message.finish() is called synchronously', async () => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.hear(/^message123$/, response => response.message.finish())
      const listenerCallback = ()=>expect(true).toEqual(false)
      robot.hear(/^message123$/, listenerCallback)
      await robot.receive(testMessage)
    })

    await test('calls non-TextListener objects', async () => {
      const testMessage = new EnterMessage(new User(1))
      robot.enter(response => {
        expect(response.message).toEqual(testMessage)
      })
      await robot.receive(testMessage)
    })

    await test('gracefully handles listener uncaughtExceptions (move on to next listener)', async () => {
      const testMessage = new TextMessage(new User(1), 'gracefully message234')
      robot.hear(/^gracefully message234$/, () => {
        throw theError
      })

      let goodListenerCalled = false
      robot.hear(/^gracefully message234$/, () => {
        goodListenerCalled = true
      })
      robot.on(Robot.EVENTS.ERROR, (err, message)=>{
        expect(err).toBeTruthy()
        expect(message).toEqual(testMessage)
      })
      await robot.receive(testMessage)
      expect(goodListenerCalled).toBeTruthy()
    })
  })

  await describe('Listener Middleware', async () => {
    await test('allows listener callback execution', async () => {
      const listenerCallback = ()=>{
        expect(true).toEqual(true)
      }
      robot.hear(/^message123$/, listenerCallback)
      robot.listenerMiddleware(context =>{
        expect(context).toBeTruthy()
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await test('can block listener callback execution', async () => {
      const listenerCallback = ()=>assert.fail('Should not be called')
      robot.hear(/^message123$/, ()=>{})
      robot.listenerMiddleware(context => {
        context.response.message.done = true
        expect(context.response.message.done).toEqual(true)
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await test('receives the correct arguments', async () => {
      robot.hear(/^message123$/, () => {})
      const testListener = Array.from(robot.listeners)[0]
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.listenerMiddleware(context => {
        expect(context.listener).toBe(testListener)
        expect(context.response.message).toEqual(testMessage)
      })
      await robot.receive(testMessage)
    })
  })

  await describe('Receive Middleware', async () => {
    await test('fires for all messages, including non-matching ones', async () => {
      const listenerCallback = ()=>expect(true).toEqual(false)
      robot.hear(/^message123$/, listenerCallback)
      robot.receiveMiddleware(async (robot, context) => {
        expect(context).toBeTruthy()
      })
      const testMessage = new TextMessage(new User(1), 'not message 123')
      await robot.receive(testMessage)
    })

    await test('can block listener execution', async () => {
      const listenerCallback = ()=>expect(true).toEqual(false)
      robot.hear(/^message123$/, listenerCallback)
      robot.receiveMiddleware(async (robot, context) => {
        expect(context).toBeTruthy()
        // Block Listener callback execution
        context.response.message.done = true
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await test('receives the correct arguments', async () => {
      robot.hear(/^message123$/, () => {})
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.receiveMiddleware(async (robot, context) => {
        expect(context.response.message).toEqual(testMessage)
      })
      await robot.receive(testMessage)
    })

    await test('allows editing the message portion of the given response', async () => {
      const testMiddlewareA = async (robot, context) => {
        context.response.message.text = 'foobar'
      }
      const testMiddlewareB = async (robot, context) => {
        // Subsequent middleware should see the modified message
        expect(context.response.message.text).toEqual('foobar')
      }
      robot.receiveMiddleware(testMiddlewareA)
      robot.receiveMiddleware(testMiddlewareB)
      // We'll never get to this if testMiddlewareA has not modified the message.
      robot.hear(/^foobar$/, (message, listener, callback)=>{
        expect(message).toBeTruthy()
        callback(true)
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })
  })

  await describe('Response Middleware', async () => {
    await test('executes response middleware in order', async () => {
      robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))
      robot.responseMiddleware(async (robot, context) => {
        context.strings[0] = context.strings[0].replace(/foobar/g, 'barfoo')
        return true
      })
      robot.responseMiddleware(async (robot, context) => {
        context.strings[0] = context.strings[0].replace(/barfoo/g, 'replaced bar-foo')
        return true
      })
      robot.adapter.on('send', (envelope, ...strings)=>{
        expect(strings[0]).toEqual('replaced bar-foo, sir, replaced bar-foo.')
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await test('allows replacing outgoing strings', async () => {
      robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))
      robot.responseMiddleware(async (robot, context) => {
        context.strings = ['whatever I want.']
        return true
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.adapter.on('send', (envelope, ...strings) => {
        expect(strings[0]).toEqual('whatever I want.')
      })
      await robot.receive(testMessage)
    })

    await test('marks plaintext as plaintext', async () => {
      robot.adapter.on('send', (envelope, ...strings) => {
        assert.ok(strings[0])
      })
      robot.hear(/^message465$/, response => response.send('foobar, sir, foobar.'))
      robot.hear(/^message578$/, response => response.play('good luck with that'))

      let method
      let plaintext
      robot.responseMiddleware(async (r, context) => {
        method = context.method
        plaintext = context.plaintext
        return true
      })

      const testMessage = new TextMessage(new User(1), 'message465')
      const testMessage2 = new TextMessage(new User(1), 'message578')
      await robot.receive(testMessage)

      expect(plaintext).toEqual(true)
      expect(method).toEqual('send')
      
      await robot.receive(testMessage2)
      expect(plaintext).toBeUndefined()
      expect(method).toEqual('play')
    })
  })
})