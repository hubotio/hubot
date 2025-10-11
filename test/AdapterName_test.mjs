import test from 'node:test'
import assert from 'node:assert/strict'
import { Robot, Adapter } from '../index.mjs'

class InMemoryAdapter extends Adapter {
}

function getRobotWithAdapter (adapter) {
  return new Robot({
    async use (robot) {
      adapter.robot = robot
      return adapter
    }
  }, false, 'Hubot', 't-bot')
}

await test('Adapter Name', async (t) => {
  await t.test('Adapter argument is an object with user function', async () => {
    const adapter = new InMemoryAdapter()
    const robot = getRobotWithAdapter(adapter)
    await robot.loadAdapter()
    assert.equal(robot.adapterName, 'InMemoryAdapter')
  })

  await t.test('Adapter argument is null', async () => {
    const robot = new Robot(null, false, 'Hubot', 't-bot')
    await robot.loadAdapter()
    assert.equal(robot.adapterName, 'Shell')
  })

  await t.test('Adapter argument is a file path', async () => {
    const robot = new Robot('../test/fixtures/MockAdapter.mjs', false, 'Hubot', 't-bot')
    await robot.loadAdapter()
    assert.equal(robot.adapterName, 'MockAdapter')
  })
})
