import SlackBot from './slack.mjs'
import './slack-extensions.mjs'
export default robot => {
  const options = {
    token: process.env.HUBOT_SLACK_TOKEN,
    disableUserSync: (process.env.DISABLE_USER_SYNC != null)
  }
  try {
    options.rtm = JSON.parse(process.env.HUBOT_SLACK_RTM_CLIENT_OPTS)
  } catch (error) {}
  try {
    options.rtmStart = JSON.parse(process.env.HUBOT_SLACK_RTM_START_OPTS)
  } catch (error) {}
  return new SlackBot(robot, options)
}
