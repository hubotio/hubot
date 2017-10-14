/**
 * Description:
 * Says pong when you say ping
 *
 * Commands:
 * hubot <ping> - replies @user pong
 *
 * Notes:
 * Sinon spies on exported function for unit tests
 */
const sinon = require('sinon')
module.exports = sinon.spy(function (robot) {
  robot.respond(/ping/i, function (res) {
    res.reply('pong')
  })
})
