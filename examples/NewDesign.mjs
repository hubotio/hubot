import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import EventEmitter from 'node:events'

class InMemoryCommandQueue {
    #queue = []
    constructor(){}
    async enqueue(command){
        this.#queue.push(command)
    }
    *dequeue(){
        yield this.#queue.shift()
    }
}
class ShellAdapter {
    constructor(){

    }
}
class Hubot extends EventEmitter {
    #queue
    #timer
    constructor(state = {}, options){
        super()
        this.#queue = new InMemoryCommandQueue()
        this.events = []
        this.decisionState = state
        this.listeners = new Set()
        this.adapter = options?.adapter ?? new ShellAdapter()
    }
    iterateOverQueue(){
        for(let request of this.#queue.dequeue()){
            if(!request) continue
            try{
                let event = this.#handle(this.decisionState, request)
                if(event) this.events.push(event)
            }catch(e){
                console.error(e)
                throw e
            }
        }
    }
    #handle(state, request){
        request.connection.write(request.message)
        for(let listener of this.listeners){
            listener.receive(request)
        }
        return request
    }
    start(period = 1000){
        this.#timer = setInterval(this.iterateOverQueue.bind(this), period)
    }
    stop(){
        clearInterval(this.#timer)
    }
    recevieMessage(message){
        this.emit('incoming message', message)
    }
    addIncomingRequest(request){
        this.#queue.enqueue(request)
    }
    async loadAdapter(adapter) {
        try {
            const module = await import(adapter)
            this.adapter = await module.default(this)
        } catch (err) {
            this.emit('error', err, adapter)
        }

    }    
}

class Chat extends EventEmitter{
    #url
    #protocols
    #buffer = []
    constructor(url, protocols){
        super()
        this.#url = url
        this.#protocols = protocols
    }
    addEventListener(eventName, listener){
        this.addListener(eventName, listener)
    }
    removeEventListener(eventName, listener){
        this.removeListener(eventName, listener)
    }
    sendMessage(message){
        this.emit('message', this, message)
    }
    write(data){
        console.log('writing data', data)
        this.#buffer.push(data)
    }
    *read(){
        yield this.#buffer.shift()
    }

}
class IncomingRequest {
    constructor(connection, message){
        this.connection = connection
        this.message = message
    }
}
describe('Explore simplifying the software design of Hubot', async ()=>{
    it('Decouple receiving a message from responding to a message', async ()=> {
        const hubot = new Hubot()
        hubot.listeners.add({
            receive(request){
                if(!/yo/.test(request.message)) return
                console.log('listening to ', request.message)
            }
        })
        hubot.start()
        const chat = new Chat('ws://localhost/testing')
        chat.addEventListener('message', (connection, message)=>{
            hubot.addIncomingRequest(new IncomingRequest(connection, message))
        })
        chat.sendMessage('Hi')
        let data = null
        await new Promise((resolve, reject)=>{
            let timer = setInterval(()=>{
                data = chat.read().next().value
                if(!data) return
                clearInterval(timer)
                hubot.stop()
                assert.deepEqual(data, 'Hi')
                resolve()
            }, 100)
        })
    })
    it('Emits an error when trying to load an adapter module is not installed', async ()=>{
        const hubot = new Hubot()
        hubot.on('error', (err, adapter)=>{
            assert.match(err.code, /ERR_MODULE_NOT_FOUND/)
        })
        await hubot.loadAdapter('test-adapter')
    })
    it('Loads an adapter module from the file system if it is not installed', async ()=>{
        const hubot = new Hubot()
        await hubot.loadAdapter('./adapters/DummyAdapter.mjs')
    })
})