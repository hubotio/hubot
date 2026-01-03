import { HttpServerPort } from './HttpServerPort.mjs'
import express from 'express'
import basicAuth from 'express-basic-auth'

class ExpressHttpServerPort extends HttpServerPort {
    get address() {
        return this.robot.server.address()
    }
    async start(port) {
        const user = process.env.EXPRESS_USER
        const pass = process.env.EXPRESS_PASSWORD
        const stat = process.env.EXPRESS_STATIC
        const address = process.env.EXPRESS_BIND_ADDRESS || process.env.BIND_ADDRESS || '0.0.0.0'
        const limit = process.env.EXPRESS_LIMIT || '100kb'
        const paramLimit = parseInt(process.env.EXPRESS_PARAMETER_LIMIT) || 1000
        const app = express()

        app.use((req, res, next) => {
            res.setHeader('X-Powered-By', `hubot/${encodeURI(this.robot.name)}`)
            return next()
        })

        if (user && pass) {
            const authUser = {}
            authUser[user] = pass
            app.use(basicAuth({ users: authUser }))
        }

        app.use(express.json({ limit }))
        app.use(express.urlencoded({ limit, parameterLimit: paramLimit, extended: true }))

        if (stat) {
            app.use(express.static(stat))
        }
        return new Promise((resolve, reject) => {
            try {
                this.robot.server = app.listen(port, address, () => {
                    this.robot.router = app
                    this.robot.emit('listening', this.robot.server)
                    resolve(this.robot.server)
                })
            } catch (err) {
                reject(err)
            }
        })
    }

    async stop() {
        if (!this.robot || !this.robot.server) {
            return
        }
        return new Promise((resolve, reject) => {
            this.robot.server.close(err => {
                if (err) {
                    return reject(err)
                }
                resolve()
            })
        })
    }
}

export default async (robot) => {
    const server = new ExpressHttpServerPort(robot)
    const port = process.env.EXPRESS_PORT || process.env.PORT || 8080
    await server.start(port)
    return server
}
