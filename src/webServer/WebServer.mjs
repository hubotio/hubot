const log = (...args) => console.log(new Date(), ...args)

class Handler {
   constructor(regex, handler){
      this.regex = regex
      this.handler = handler
   }
   async execute(req, server){
      return await this.handler(req, server)
   }
}

class GetHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['get']
   }
}

class PostHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['post']
   }
}

class PutHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['put']
   }
}

class DeleteHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['delete']
   }
}

class PatchHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['patch']
   }
}

class HeadHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['head']
   }
}

class OptionsHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['options']
   }
}

class TraceHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['trace']
   }
}

class UseHandler extends Handler {
   constructor(regex, handler){
      super(regex, handler)
      this.methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace']
   }
}

const filters = new Set()

export default {
   get(regex, handler){
      filters.add(new GetHandler(regex, handler))
   },
   post(regex, handler){
      filters.add(new PostHandler(regex, handler))
   },
   put(regex, handler){
      filters.add(new PutHandler(regex, handler))
   },
   delete(regex, handler){
      filters.add(new DeleteHandler(regex, handler))
   },
   patch(regex, handler){
      filters.add(new PatchHandler(regex, handler))
   },
   head(regex, handler){
      filters.add(new HeadHandler(regex, handler))
   },
   options(regex, handler){
      filters.add(new OptionsHandler(regex, handler))
   },
   trace(regex, handler){
      filters.add(new TraceHandler(regex, handler))
   },
   use(regex, handler){
      filters.add(new UseHandler(regex, handler))
   },
   async fetch(req, server){
      const url = new URL(req.url)
      const cookies = req.headers.get('cookie')?.split(/;\s?/).map(c => c.split('=').reduce((a, b) => {return {[a]: b ?? null}}))
      const sessionId = cookies.find(c => c.SessionId)?.SessionId ?? null
      const requestUrl = new URL(req.url)

      if(!sessionId && req.headers.get('connection') == 'Upgrade'){
         sessionId = Math.random(32)
      }

      if(server.upgrade(req, {
         data: {
            name: requestUrl.searchParams.get('name') || `Client #`,
            room: requestUrl.searchParams.get('room') || 'general',
            createdAt: Date.now(),
            sessionId
         },
         headers: {
            'Set-Cookie': `SessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure;`
         }
      })){
         log('Upgraded to websocket')
         return new Response("", {status: 101, headers: {
            'Set-Cookie': `SessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure;`
         }})
      }
      let response =  new Response()

      for await (const [key, filter] of filters.entries()){
         if(!filter.methods.includes(req.methodExtended?.toLowerCase() ?? req.method.toLowerCase())) continue
         if(filter.regex){
            const match = url.pathname.match(filter.regex)
            if(!match) continue
            req.match = match
         }
         const handledResponse = await filter.execute(req, response, server)
         if(handledResponse) response = handledResponse
      }
      return response
   },
   websocket: {
      open(socket){
         socket.subscribe('room')
         socket.publish('room', `${socket.data.sessionId} joined the room`)
      },
      message(socket, message){
         socket.publish('room', `${socket.data.sessionId}: ${message}`)
      },
      close(socket){
         socket.unsubscribe('room')
         socket.publish('room', `${socket.data.sessionId} left the room`)
      },
      drain(socket){

      }
   },
   port: process.env.PORT ?? 3000
}