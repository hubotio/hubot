/*
Copyright (c) 2014 rick

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*

April 15, 2023
Reasoning:
ScopedHttpClient is no longer maintained.

Decision:
Implement a phased approach to deprecate `robot.http` all together in favor of `fetch`.
1. Convert ScopedHttpClient to Javascript and include the module in this repo
2. Add a deprecation warning to `robot.http`
3. Remove `robot.http` in a future release
*/
const path = require('path')
const http = require('http')
const https = require('https')
const qs = require('querystring')

const nonPassThroughOptions = [
  'headers', 'hostname', 'encoding', 'auth', 'port',
  'protocol', 'agent', 'httpAgent', 'httpsAgent', 'query', 'host', 'path',
  'pathname', 'slashes', 'hash'
]

class ScopedClient {
  constructor (url, options) {
    this.options = this.buildOptions(url, options)
    this.passthroughOptions = reduce(extend({}, this.options), nonPassThroughOptions)
  }

  request (method, reqBody, callback) {
    let req
    if (typeof (reqBody) === 'function') {
      callback = reqBody
      reqBody = null
    }

    try {
      let requestModule
      const headers = extend({}, this.options.headers)
      const sendingData = reqBody && (reqBody.length > 0)
      headers.Host = this.options.hostname
      if (this.options.port) { headers.Host += `:${this.options.port}` }

      // If `callback` is `undefined` it means the caller isn't going to stream
      // the body of the request using `callback` and we can set the
      // content-length header ourselves.
      //
      // There is no way to conveniently assert in an else clause because the
      // transfer encoding could be chunked or using a newer framing mechanism.
      // And this is why we should'nt be creating a wrapper around http.
      // Please just use `fetch`.
      if (callback === undefined) {
        headers['Content-Length'] = sendingData ? Buffer.byteLength(reqBody, this.options.encoding) : 0
      }

      if (this.options.auth) {
        headers.Authorization = 'Basic ' + Buffer.from(this.options.auth, 'base64')
      }

      const port = this.options.port ||
        ScopedClient.defaultPort[this.options.protocol] || 80

      let {
        agent
      } = this.options
      if (this.options.protocol === 'https:') {
        requestModule = https
        if (this.options.httpsAgent) { agent = this.options.httpsAgent }
      } else {
        requestModule = http
        if (this.options.httpAgent) { agent = this.options.httpAgent }
      }

      const requestOptions = {
        port,
        host: this.options.hostname,
        method,
        path: this.fullPath(),
        headers,
        agent
      }

      // Extends the previous request options with all remaining options
      extend(requestOptions, this.passthroughOptions)

      req = requestModule.request(requestOptions)

      if (this.options.timeout) {
        req.setTimeout(this.options.timeout, () => req.abort())
      }

      if (callback) {
        req.on('error', callback)
      }
      if (sendingData) { req.write(reqBody, this.options.encoding) }
      if (callback) { callback(null, req) }
    } catch (err) {
      if (callback) { callback(err, req) }
    }

    return callback => {
      if (callback) {
        req.on('response', res => {
          res.setEncoding(this.options.encoding)
          let body = ''
          res.on('data', chunk => {
            body += chunk
          })

          return res.on('end', () => callback(null, res, body))
        })
        req.on('error', error => callback(error, null, null))
      }

      req.end()
      return this
    }
  }

  // Adds the query string to the path.
  fullPath (p) {
    const search = qs.stringify(this.options.query)
    let full = this.join(p)
    if (search.length > 0) { full += `?${search}` }
    return full
  }

  scope (url, options, callback) {
    const override = this.buildOptions(url, options)
    const scoped = new ScopedClient(this.options)
      .protocol(override.protocol)
      .host(override.hostname)
      .path(override.pathname)

    if (typeof (url) === 'function') {
      callback = url
    } else if (typeof (options) === 'function') {
      callback = options
    }
    if (callback) { callback(scoped) }
    return scoped
  }

  join (suffix) {
    const p = this.options.pathname || '/'
    if (suffix && (suffix.length > 0)) {
      if (suffix.match(/^\//)) {
        return suffix
      } else {
        return path.join(p, suffix)
      }
    } else {
      return p
    }
  }

  path (p) {
    this.options.pathname = this.join(p)
    return this
  }

  query (key, value) {
    if (!this.options.query) { this.options.query = {} }
    if (typeof (key) === 'string') {
      if (value) {
        this.options.query[key] = value
      } else {
        delete this.options.query[key]
      }
    } else {
      extend(this.options.query, key)
    }
    return this
  }

  host (h) {
    if (h && (h.length > 0)) { this.options.hostname = h }
    return this
  }

  port (p) {
    if (p && ((typeof (p) === 'number') || (p.length > 0))) {
      this.options.port = p
    }
    return this
  }

  protocol (p) {
    if (p && (p.length > 0)) { this.options.protocol = p }
    return this
  }

  encoding (e) {
    if (e == null) { e = 'utf-8' }
    this.options.encoding = e
    return this
  }

  timeout (time) {
    this.options.timeout = time
    return this
  }

  auth (user, pass) {
    if (!user) {
      this.options.auth = null
    } else if (!pass && user.match(/:/)) {
      this.options.auth = user
    } else {
      this.options.auth = `${user}:${pass}`
    }
    return this
  }

  header (name, value) {
    this.options.headers[name] = value
    return this
  }

  headers (h) {
    extend(this.options.headers, h)
    return this
  }

  buildOptions () {
    const options = {}
    let i = 0
    while (arguments[i]) {
      const ty = typeof arguments[i]
      if (ty === 'string') {
        const parsedUrl = new URL(arguments[i])
        const query = {}
        parsedUrl.searchParams.forEach((v, k) => {
          query[k] = v
        })

        extend(options, {
          href: parsedUrl.href,
          origin: parsedUrl.origin,
          protocol: parsedUrl.protocol,
          username: parsedUrl.username,
          password: parsedUrl.password,
          host: parsedUrl.host,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          pathname: parsedUrl.pathname,
          search: parsedUrl.search,
          searchParams: parsedUrl.searchParams,
          query,
          hash: parsedUrl.hash
        })
        delete options.url
        delete options.href
        delete options.search
      } else if (ty !== 'function') {
        extend(options, arguments[i])
      }
      i += 1
    }
    if (!options.headers) { options.headers = {} }
    if (options.encoding == null) { options.encoding = 'utf-8' }
    return options
  }
}

ScopedClient.methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'HEAD']
ScopedClient.methods.forEach(method => {
  ScopedClient.prototype[method.toLowerCase()] = function (body, callback) { return this.request(method, body, callback) }
})
ScopedClient.prototype.del = ScopedClient.prototype.delete

ScopedClient.defaultPort = { 'http:': 80, 'https:': 443, http: 80, https: 443 }

const extend = function (a, b) {
  Object.keys(b).forEach(prop => {
    a[prop] = b[prop]
  })
  return a
}

// Removes keys specified in second parameter from first parameter
const reduce = function (a, b) {
  for (const propName of Array.from(b)) {
    delete a[propName]
  }
  return a
}

exports.create = (url, options) => new ScopedClient(url, options)
