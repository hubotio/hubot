import test from 'node:test'
import assert from 'node:assert/strict'
import { HttpServerPort } from '../../src/ports/HttpServerPort.mjs'

test('HttpServerPort API', async t => {
    await t.test('start and stop', async () => {
        const server = new HttpServerPort({})
        await server.start(0)
        assert.equal(server.address().port, 0)
        await server.stop()
    })

    await t.test('use', async () => {
        const server = new HttpServerPort({})
        server.use((req, res) => {
            res.end('Hello, World!')
        })
        await server.start(0)
        await server.stop()
    })

    await t.test('http methods', async () => {
        const server = new HttpServerPort({})
        await server.start(0)
        assert.ok(server.get)
        assert.ok(server.post)
        assert.ok(server.put)
        assert.ok(server.patch)
        assert.ok(server.query)
        assert.ok(server.delete)
        assert.ok(server.trace)
        assert.ok(server.options)
        assert.ok(server.head)
        await server.stop()
    })
})