import { createServer } from 'http'

const queue = []

setInterval(function(){
    const context = queue.pop()
    if(!context) return
    console.log(context.req.url, context.req.headers.accept.split(';'))
    context.res.writeHead(200, { 'Content-Type': 'text/plain' })
    context.res.end('Hello World\n')
}, 60)

const server = createServer(function(req, res) {
    queue.push({ req, res })
})
server.listen(function(){
    console.log(`Server running at http://localhost:${this.address().port}/`)
})
Reflect.defineProperty(server, 'queue', {
    get(){
        return queue
    },
    configurable: false,
    enumerable: true
})
export default server