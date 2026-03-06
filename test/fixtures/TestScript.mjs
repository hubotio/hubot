'use strict'

// Description: A test .mjs script for the robot to load
//
// Commands:
//   hubot test mjs - Responds with a test response from a .mjs script
//

export default robot => {
  robot.hasLoadedTestMjsScript = true
  robot.respond(/test$/, async res => {
    await res.reply('test response from .mjs script')
  })
}
