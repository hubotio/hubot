'use strict'
import assert from 'node:assert/strict'
import test from 'bun:test'
import { Robot, TextListener, CatchAllMessage, User, EnterMessage, LeaveMessage, TextMessage, TopicMessage } from '../index.mjs'
import {URL} from 'node:url'

const __dirname = new URL('.', import.meta.url).pathname
const domain = '127.0.0.1'

const BEG = `\x1b[`
const END = `\x1b[0m`
const log = function(){
  console.log(`${BEG}32;49m[${new Date()} robot-test]${END}`, ...arguments)
}

test('Robot', async (t) => {
  let robot = null
  let user = null
  t.beforeEach(async (t) => {
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

  t.afterEach(async (t) => {
    robot.shutdown()
  })

  await t.test('#http', async (t) => {
    await t.test('persists the url passed in', async (t) => {
      const url = `http://${domain}`
      const httpClient = robot.http(url)
      assert.deepEqual(httpClient.url, url)
    })

    await t.test('actually responds to an http get request', async (t) => {
      const url = `http://${domain}:${robot.port}`
      const httpClient = robot.http(url)
      robot.router.get('/', (req, res) => {
        res.end()
      })

      const response = await httpClient.get()
      assert.deepEqual(response.error, null)
      assert.deepEqual(response.body, '')
      assert.deepEqual(response.res.headers['x-powered-by'], `hubot/${robot.name}`)
    })

    await t.test('actually does a post', async (t) => {
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
      assert.deepEqual(response.error, null)
      assert.deepEqual(response.res.statusCode, 200)
      assert.deepEqual(JSON.parse(response.body).name, 'jg')  
    })

    await t.test('passes options through to the ScopedHttpClient', async (t) => {
      const agent = {}
      const httpClient = robot.http(`http://${domain}`, { agent })
      assert.deepEqual(httpClient.options.agent, agent)
    })

    await t.test('sets a sane user agent', async (t) => {
      const agent = {}
      const httpClient = robot.http(`http://${domain}`, { agent })
      assert.ok(httpClient.options.headers['User-Agent'].indexOf('Hubot') > -1)
    })

    await t.test('merges in any global http options', async (t) => {
      const agent = {}
      robot.globalHttpOptions = { agent }
      const httpClient = robot.http(`http://${domain}`)
      assert.deepEqual(httpClient.options.agent, agent)
    })

    await t.test('local options override global http options', async (t) => {
      const agentA = {}
      const agentB = {}
      robot.globalHttpOptions = { agent: agentA }
      const httpClient = robot.http(`http://${domain}`, { agent: agentB })
      assert.deepEqual(httpClient.options.agent, agentB)
    })
  })
  
  await t.test('#respondPattern', async (t) => {
    await t.test('matches messages starting with robot\'s name', async (t) => {
      const testMessage = robot.name + 'message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      assert.ok(pattern.test(testMessage))
      const match = testMessage.match(pattern)[1]
      assert.deepEqual(match, 'message123')
    })

    await t.test('matches messages starting with robot\'s alias', async (t) => {
      const testMessage = robot.alias + 'message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      assert.ok(pattern.test(testMessage))
      const match = testMessage.match(pattern)[1]
      assert.deepEqual(match, 'message123')
    })

    await t.test('does not match unaddressed messages', async (t) => {
      const testMessage = 'message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      assert.deepEqual(pattern.test(testMessage), false)
    })

    await t.test('matches properly when name is substring of alias', async (t) => {
      robot.name = 'Meg'
      robot.alias = 'Megan'
      const testMessage1 = robot.name + ' message123'
      const testMessage2 = robot.alias + ' message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      assert.ok(pattern.test(testMessage1))
      const match1 = testMessage1.match(pattern)[1]
      assert.deepEqual(match1, 'message123')
      assert.ok(pattern.test(testMessage2))
      const match2 = testMessage2.match(pattern)[1]
      assert.deepEqual(match2, 'message123')
    })

    await t.test('matches properly when alias is substring of name', async (t) => {
      robot.name = 'Megan'
      robot.alias = 'Meg'
      const testMessage1 = robot.name + ' message123'
      const testMessage2 = robot.alias + ' message123'
      const testRegex = /(.*)/
      const pattern = robot.respondPattern(testRegex)
      assert.ok(pattern.test(testMessage1))
      const match1 = testMessage1.match(pattern)[1]
      assert.deepEqual(match1, 'message123')
      assert.ok(pattern.test(testMessage2))
      const match2 = testMessage2.match(pattern)[1]
      assert.deepEqual(match2, 'message123')
    })
  })

  await t.test('#listen', async (t) => {
    await t.test('registers a new listener directly', async (t) => {
      assert.deepEqual(robot.listeners.size, 0)
      robot.listen(() => {}, () => {})
      assert.deepEqual(robot.listeners.size, 1)
    })
  })

  await t.test('#hear', async (t) => {
    await t.test('registers a new listener directly', async (t) =>  {
      assert.deepEqual(robot.listeners.size, 0)
      robot.hear(/.*/, () => {})
      assert.deepEqual(robot.listeners.size, 1)
    })
  })

  await t.test('#respond', async (t) => {
    await t.test('registers a new listener using hear', async (t) => {
      robot.respond(/.*/, ()=>{})
      assert.deepEqual(robot.listeners.size, 1)
      assert.ok(Array.from(robot.listeners)[0] instanceof TextListener)
    })
  })

  await t.test('#room messages', async (t) => {
    await t.test('Enter', async (t) => {
      robot.enter((message, listener, callback)=>{
        assert.ok(message instanceof EnterMessage)
      })
      await robot.receive(new EnterMessage(new User(1), null, ()=>{}))
    })
    await t.test('Leave', async (t) => {
      robot.leave((message, listener, callback)=>{
        assert.ok(message instanceof LeaveMessage)
      })
      await robot.receive(new LeaveMessage(new User(1), null, ()=>{}))
    })
    await t.test('Topic', async (t) => {
      robot.topic((message, listener, callback)=>{
        assert.ok(message instanceof TopicMessage)
      })
      await robot.receive(new TopicMessage(new User(1), null, ()=>{}))
    })
    await t.test('matches EnterMessages', async (t) => {
      const testMessage = new EnterMessage(new User(1))
      robot.enter(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.ok(result)
    })

    await t.test('does not match TextMessages', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.enter(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.deepEqual(result, false)
    })

    await t.test('does not match TextMessages', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.leave(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.deepEqual(result, false)
    })

    await t.test('does not match TextMessages', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.topic(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.deepEqual(result, false)
    })
  })

  await t.test('#receive', async (t) => {
    await t.test('Catch all', async (t) => {
      const testMessage = new TextMessage(new User(1, {room: '#testing'}), 'message123')
      robot.catchAll((message, listener, callback)=>{
        assert.ok(message instanceof CatchAllMessage)
      })
      await robot.receive(new CatchAllMessage(testMessage, null, ()=>{}))
    })

    await t.test('does not trigger a CatchAllMessage if a listener matches', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.listen(message => true, async response => {
        console.log('shouldnt be here')
        assert.deepEqual(message, testMessage)
      })
      robot.catchAll(response => {
        assert.fail('Should not be called')
      })
      await robot.receive(testMessage)
    })

    await t.test('stops processing if a listener marks the message as done', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.listen(message => true, async response => {
        response.message.done = true
        assert.ok(true)
      })
      robot.listen(message => true, async response => {
        assert.fail('Should not be caleld')
      })
      await robot.receive(testMessage)
    })
  })

  await t.test('#error handling', async (t) => {
    await t.test('gracefully handles listener uncaughtExceptions (move on to next listener)', async (t) => {
      const testMessage = {}
      const theError = new Error('Fake error')
      let goodListenerCalled = false
      robot.listen(message => true, async response => {
        throw theError
      })
      robot.listen(message => true, async response => {
        goodListenerCalled = true
        assert.ok(goodListenerCalled)
      })
      robot.on(Robot.EVENTS.ERROR, (err, message)=>{
        assert.deepEqual(err, theError)
        assert.deepEqual(message, testMessage)
      })

      await robot.receive(testMessage)
      assert.ok(goodListenerCalled)
    })
  })

  await t.test('#loadFile', async (t) => {
    await t.test('should load .mjs files in the scripts folder', async (t)=> {
      const module = await robot.loadMjsFile(`${__dirname}scripts/test-script.mjs`)
      assert.deepEqual(typeof module.default, 'function')
    })
  })

  await t.test('#send', async (t) => {
    await t.test('delegates to adapter "send" with proper context', async (t) => {
      robot.adapter.on('send', (envelope, ...strings)=>{
        assert.deepEqual(strings[0], 'test message')
      })
      await robot.send({}, 'test message')
    })
  })

  await t.test('#reply', async (t) => {
    await t.test('delegates to adapter "reply" with proper context', async (t) => {
      robot.adapter.on('reply', (envelope, ...strings)=>{
        assert.deepEqual(strings[0], 'test message')
      })
      await robot.reply({}, 'test message')
    })

    await t.test('passes an adapater context through so that custom adapaters have access to their stuff', async (t) => {
      robot.on('error', (err)=>{
        assert.fail('Should not be called')
      })
      const testMessage = new TextMessage(new User(1, {
        room: '#adaptertest'
      }), 'TestHubot test adapater context', 1, {
        async adapterSendMethod(arg){
          assert.deepEqual(arg, 'test adapater context')
        }
      })
      robot.respond(/test/, async resp => {
        await resp.message.adapterContext.adapterSendMethod('test adapater context')
      })
      await robot.receive(testMessage)
    })
  })

  await t.test('#messageRoom', async (t) => {
    await t.test('delegates to adapter "send" with proper context', async (t) => {
      robot.adapter.on('send', ()=>{
        assert.ok(true)
      })
      robot.messageRoom('testRoom', 'messageRoom test')
    })
  })

  await t.test('#hear', async (t) => {
    await t.test('matches TextMessages', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.hear(/^message123$/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.ok(result)
    })

    await t.test('does not match EnterMessages', async (t) =>  {
      const testMessage = new EnterMessage(new User(1))
      robot.hear(/.*/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.deepEqual(result, undefined)
    })
  })

  await t.test('#respond', async (t) => {
    await t.test('matches TextMessages addressed to the robot', (t) => {
      const testMessage = new TextMessage(new User(1), 'TestHubot message123')
      robot.respond(/message123$/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.ok(result)
    })

    await t.test('does not match EnterMessages', (t) => {
      const testMessage = new EnterMessage(new User(1))
      robot.respond(/.*/, ()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.deepEqual(result, undefined)
    })
  })

  await t.test('#catchAll', async (t) => {
    await t.test('matches CatchAllMessages', async (t) => {
      const testMessage = new CatchAllMessage(new TextMessage(new User(1), 'message123'))
      robot.catchAll(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.ok(result)
    })

    await t.test('does not match TextMessages', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.catchAll(()=>{})
      const result = Array.from(robot.listeners)[0].matcher(testMessage)
      assert.deepEqual(result, false)
    })
  })

  await t.test('Message Processing', async (t) => {
    await t.test('calls a matching listener', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.hear(/^message123$/, response => {
        assert.deepEqual(response.message, testMessage)
      })
      await robot.receive(testMessage)
    })

    await t.test('calls multiple matching listeners', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      let listenersCalled = 0
      const listenerCallback = response => {
        assert.deepEqual(response.message, testMessage)
        listenersCalled++
      }

      robot.hear(/^message123$/, listenerCallback)
      robot.hear(/^message123$/, listenerCallback)

      await robot.receive(testMessage)
      assert.deepEqual(listenersCalled, 2)
    })

    await t.test('calls the catch-all listener if no listeners match', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      const listenerCallback = ()=>{
        assert.fail('Should not be called')
      }
      robot.hear(/^no-matches$/, listenerCallback)
      robot.catchAll(response => {
        assert.deepEqual(response.message, testMessage)
      })
      await robot.receive(testMessage)
    })

    await t.test('does not call the catch-all listener if any listener matched', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      let counter = 0
      const listenerCallback = ()=>{
        counter++
        assert.deepEqual(counter, 1)
      }
      robot.hear(/^message123$/, listenerCallback)
      const catchAllCallback = ()=>assert.fail('Should not be called')
      robot.catchAll(catchAllCallback)
      await robot.receive(testMessage)
    })

    await t.test('stops processing if message.finish() is called synchronously', async (t) => {
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.hear(/^message123$/, response => response.message.finish())
      const listenerCallback = ()=>assert.fail('Should not be called')
      robot.hear(/^message123$/, listenerCallback)
      await robot.receive(testMessage)
    })

    await t.test('calls non-TextListener objects', async (t) => {
      const testMessage = new EnterMessage(new User(1))
      robot.enter(response => {
        assert.deepEqual(response.message, testMessage)
      })
      await robot.receive(testMessage)
    })

    await t.test('gracefully handles listener uncaughtExceptions (move on to next listener)', async (t) => {
      const testMessage = new TextMessage(new User(1), 'gracefully message234')
      robot.hear(/^gracefully message234$/, () => {
        throw theError
      })

      let goodListenerCalled = false
      robot.hear(/^gracefully message234$/, () => {
        goodListenerCalled = true
      })
      robot.on(Robot.EVENTS.ERROR, (err, message)=>{
        assert.ok(err)
        assert.deepEqual(message, testMessage)
      })
      await robot.receive(testMessage)
      assert.ok(goodListenerCalled)
    })
  })

  await t.test('Listener Middleware', async (t) => {
    await t.test('allows listener callback execution', async (t) => {
      const listenerCallback = ()=>{
        assert.ok(true)
      }
      robot.hear(/^message123$/, listenerCallback)
      robot.listenerMiddleware(context =>{
        assert.ok(context)
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await t.test('can block listener callback execution', async (t) => {
      const listenerCallback = ()=>assert.fail('Should not be called')
      robot.hear(/^message123$/, ()=>{})
      robot.listenerMiddleware(context => {
        context.response.message.done = true
        assert.ok(context.response)
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await t.test('receives the correct arguments', async (t) => {
      robot.hear(/^message123$/, () => {})
      const testListener = Array.from(robot.listeners)[0]
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.listenerMiddleware(context => {
        assert.deepEqual(context.listener, testListener)
        assert.deepEqual(context.response.message, testMessage)
      })
      await robot.receive(testMessage)
    })
  })

  await t.test('Receive Middleware', async (t) => {
    await t.test('fires for all messages, including non-matching ones', async (t) => {
      const listenerCallback = ()=>assert.fail('Should not be called')
      robot.hear(/^message123$/, listenerCallback)
      robot.receiveMiddleware(async (robot, context) => {
        assert.ok(context)
      })
      const testMessage = new TextMessage(new User(1), 'not message 123')
      await robot.receive(testMessage)
    })

    await t.test('can block listener execution', async (t) => {
      const listenerCallback = ()=>assert.fail('Should not be called')
      robot.hear(/^message123$/, listenerCallback)
      robot.receiveMiddleware(async (robot, context) => {
        assert.ok(context)
        // Block Listener callback execution
        context.response.message.done = true
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await t.test('receives the correct arguments', async (t) => {
      robot.hear(/^message123$/, () => {})
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.receiveMiddleware(async (robot, context) => {
        assert.deepEqual(context.response.message, testMessage)
      })
      await robot.receive(testMessage)
    })

    await t.test('allows editing the message portion of the given response', async (t) => {
      const testMiddlewareA = async (robot, context) => {
        context.response.message.text = 'foobar'
      }
      const testMiddlewareB = async (robot, context) => {
        // Subsequent middleware should see the modified message
        assert.deepEqual(context.response.message.text, 'foobar')
      }
      robot.receiveMiddleware(testMiddlewareA)
      robot.receiveMiddleware(testMiddlewareB)
      // We'll never get to this if testMiddlewareA has not modified the message.
      robot.hear(/^foobar$/, (message, listener, callback)=>{
        assert.ok(message)
        callback(true)
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })
  })

  await t.test('Response Middleware', async (t) => {
    await t.test('executes response middleware in order', async (t) => {
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
        assert.deepEqual(strings[0], 'replaced bar-foo, sir, replaced bar-foo.')
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      await robot.receive(testMessage)
    })

    await t.test('allows replacing outgoing strings', async (t) => {
      robot.hear(/^message123$/, response => response.send('foobar, sir, foobar.'))
      robot.responseMiddleware(async (robot, context) => {
        context.strings = ['whatever I want.']
        return true
      })
      const testMessage = new TextMessage(new User(1), 'message123')
      robot.adapter.on('send', (envelope, ...strings) => {
        assert.deepEqual(strings[0], 'whatever I want.')
      })
      await robot.receive(testMessage)
    })

    await t.test('marks plaintext as plaintext', async (t) => {
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

      assert.deepEqual(plaintext, true)
      assert.deepEqual(method, 'send')
      
      await robot.receive(testMessage2)
      assert.deepEqual(plaintext, undefined)
      assert.deepEqual(method, 'play')
    })
  })
})