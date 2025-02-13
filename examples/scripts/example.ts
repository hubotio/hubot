import type { Robot, Response } from 'hubot'

export default async (robot: Robot) => {
  // Example TypeScript script
  robot.hear(/hello/i, async (res: Response) => {
    await res.send('Hello from TypeScript!')
  })

  robot.enter(async (res: Response) => {
    await res.send(`Welcome ${res.message.user.name}!`)
  })
}
