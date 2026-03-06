'use strict'

// Description: A test .ts script for the robot to load
//
// Commands:
//   hubot test ts - Responds with a test response from a .ts script
//

export default robot => {
  robot.hasLoadedTestTsScript = true
  robot.respond(/test$/, async res => {
    await res.reply('test response from .ts script')
  })
}
