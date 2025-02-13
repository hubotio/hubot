import type { Robot, Response } from 'hubot'

export default async (robot: Robot) => {
  const welcomeMessages = [
    'Welcome to the team! 👋',
    'Hello there! Great to have you here!',
    'Welcome aboard! 🚀'
  ]
  
  robot.enter(async (res: Response) => {
    const username = res.message.user.name
    await res.send(res.random(welcomeMessages))
  })
}
