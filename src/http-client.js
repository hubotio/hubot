const http = require("http")
const https = require("https")
const Url = require("url")
const transport = {
  http, https
}
class Client {
  constructor (url, options) {
    this.url = url
    this.parsedUrl = Url.parse(url)
    this.options = Object.assign({
      headers: {},
      hostname: this.parsedUrl.hostname,
      port: this.parsedUrl.port,
      protocol: this.parsedUrl.protocol,
      pathname: this.parsedUrl.pathname,
      path: this.parsedUrl.path
    }, options)
  }
  header (key, value) {
    this.options.headers[key] = value
    return this
  }
  get () {
    const cb = callback => {
      let body = ''
      const httpOrHttps = transport[this.parsedUrl.protocol.replace(":", "")]
      let req = httpOrHttps.get(this.url, this.options, res => {
        const {statusCode} = res
        res.on("data", chunk => {
          body += chunk
        })
        res.on("end", ()=>{
          callback(null, res, body)
        })
        res.on("error", err => {
          callback(err, res, body)
        })
      })
      req.on("error", err => {
        callback(err, {}, body)
      })
    }

    return cb
  }
  post (data) {
    const cb = callback => {
      let body = ''
      const httpOrHttps = transport[this.parsedUrl.protocol.replace(":", "")]
      this.options.method = "POST"
      const req = httpOrHttps.request(this.options, res => {
        const {statusCode} = res
        res.on("data", chunk => {
          body += chunk
        })
        res.on("end", ()=>{
          callback(null, res, body)
        })
        res.on("error", err => {
          callback(err, res, body)
        })
      })
      req.on("error", err => {
        callback(err, {}, body)
      })
      req.write(data)
      req.end()
    }
    return cb
  }
}

const HttpClient = {
  create (url, options) {
    return new Client(url, options)
  }
}

module.exports = HttpClient
