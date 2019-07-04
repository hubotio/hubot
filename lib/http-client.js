
class Client {
  constructor (url, options) {
    this.options = Object.assign({
        headers: {}
    }, options)
  }
  header (key, value) {
    this.options.headers[key] = value
    return this
  }
  get get () {

  }
  get post () {
    return (callback) => {
        callback(_err, res, body)
    }
  }
}

const HttpClient = {
  create (url, options) {
    return new Client(url, options)
  }
}

///        HttpClient.create(`${herokuUrl}hubot/ping`).post()((_err, res, body) => {
//     this.logger.info('keep alive ping!')
// })

module.exports = HttpClient
