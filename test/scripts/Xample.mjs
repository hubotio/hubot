// Description:
//   Test script
//
// Commands:
//   hubot helo - Responds with HELO World!.
//
// Notes:
//   This is a test script.
//

export default (robot) => {
  robot.respond(/helo$/, async res => {
    await res.reply(`HELO World! I'm ${robot.name}.`)
  })
  robot.respond(/helo (.*)/gi, async res => {
    await res.send(`Hello World! I'm ${robot.name}.`)
  })
  robot.router.get('/helo', async (req, res) => {
    res.send(`HELO World! I'm ${robot.name}.`)
  })
}
