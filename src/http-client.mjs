import http from 'node:http'
import https from 'node:https'

const transport = {
  http, https
}
class Client {
  constructor (url, options) {
    this.url = url
    this.parsedUrl = new URL(url)
    this.options = Object.assign({
      headers: {},
      hostname: this.parsedUrl.hostname,
      port: this.parsedUrl.port,
      protocol: this.parsedUrl.protocol,
      pathname: this.parsedUrl.pathname,
      path: this.parsedUrl.pathname
    }, options)
  }

  header (key, value) {
    this.options.headers[key] = value
    return this
  }

  async get () {
    const p = new Promise((resolve, reject)=>{
      let body = ''
      const httpOrHttps = transport[this.parsedUrl.protocol.replace(':', '')]
      const req = httpOrHttps.get(this.url, this.options, res => {
        res.on('data', chunk => {
          body += chunk
        })
        res.on('end', () => {
          resolve({error: null, res, body})
        })
        res.on('error', err => {
          reject({error: err, res, body})
        })
      })
      req.on('error', err => {
        console.error(err)
        reject({error: err, res: {}, body})
      })
    })
    return p
  }

  async post (data) {
    const p = new Promise((resolve, reject)=>{
      let body = ''
      const httpOrHttps = transport[this.parsedUrl.protocol.replace(':', '')]
      this.options.method = 'POST'
      const req = httpOrHttps.request(this.options, res => {
        res.on('data', chunk => {
          body += chunk
        })
        res.on('end', () => {
          resolve({error: null, res, body})
        })
        res.on('error', err => {
          reject({error: err, res, body})
        })
      })
      req.on('error', err => {
        reject({error: err, res: {}, body})
      })
      req.write(data)
      req.end()
    })
    return p
  }
}

const HttpClient = {
  create (url, options) {
    return new Client(url, options)
  }
}

export default HttpClient
