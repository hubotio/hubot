'use strict'
import Robot from './robot.mjs'
class Middleware {
  constructor (robot) {
    this.robot = robot
    this.stack = new Set()
  }

  // Public: Execute all middleware with await/async
  // response - Response object that is passed through the middleware stack.
  // Returns response
  async execute (response) {
    for await (let middleware of this.stack) {
      let shouldContinue = true
      try{
        shouldContinue = await middleware(this.robot, response)
      }catch(e){
        shouldContinue = false
        this.robot.emit(Robot.EVENTS.ERROR, e, response)
      }finally{
        if(!shouldContinue) break
      }
    }
    return response
  }

  // Public: Registers new middleware
  //
  // middleware - A generic pipeline component function
  //
  // Returns nothing.
  register (middleware) {
    this.stack.add(middleware)
  }
}

export default Middleware
