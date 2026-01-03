function randomPort() {
    return Math.floor(Math.random() * (65535 - 1024)) + 1024
}
class HttpServerPort {
    constructor(robot) {
        this.robot = robot
    }
    async stop() {}
    async start(port) {
        if (port === 0) {
            port = randomPort()
        }
        this.port = port
        this.robot.server = {}
        this.robot.router = this
        return this.robot.server
    }
    address() {
        return { port: this.port }
    }
    use(handler) {}
    get(path, handler) {}
    post(path, handler) {}
    put(path, handler) {}
    patch(path, handler) {}
    query(path, handler) {}
    delete(path, handler) {}
    trace(path, handler) {}
    options(path, handler) {}
    head(path, handler) {}
}

export {
    HttpServerPort
}