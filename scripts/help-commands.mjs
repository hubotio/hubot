// Description:
// Responds with all the script help commands.
//
// Dependencies:
//
// Configuration:
//
// Commands:
//   hubot help - list loaded scripts commands.
//
// Notes:
//
// Author:
//   J0ey Guerra

  export default robot => {
    robot.respond(/help$/i, resp => {
        resp.send(robot.helpCommands().join('\n'))
    })
  }
  