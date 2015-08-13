---
title: Implementation Notes
permalink: /docs/implementation/index.html
layout: docs
---

For the purpose of maintainability, several internal flows are documented here.

## Message Processing

When a new message is received by an adapter, a new Message object is constructed and passed to `robot.receive` (async). `robot.receive` then attempts to execute each Listener in order of registration by calling `listener.call` (async), passing in the Listener Middleware stack. `listener.call` first checks to see if the listener matches (`match` method, sync), and if so, calls `middleware.execute` (async) on the provided middleware.

`middleware.execute` calls each middleware in order of registration. Middleware can either continue forward (call `next`) or abort (call `done`). If all middleware continues, `middleware.execute` calls `next` (the `listener.call` callback). If any middleware aborts, `middleware.execute` calls `done` (which eventually returns to the `robot.receive` callback).

`middleware.execute` `next` returns to `listener.call`, which executes the matched Listener's callback and then calls the `robot.receive` callback.

Inside the `robot.receive` processing loop, `message.done` is checked after each `listener.call`. If the message has been marked as done, `robot.receive` returns. This correctly handles asynchronous middleware, but will not catch an asynchronous set of `message.done` inside the listener callback (which is expected to be synchronous).

If no listener matches the message (distinct from setting `message.done`), a CatchAllMessage is created which wraps the original message. This new message is run through all listeners again testing for a match. `robot.catchAll` creates a special listener that only matches CatchAllMessages.

## Listeners

Listeners are registered using several functions on the `robot` object: `hear`, `respond`, `enter`, `leave`, `topic`, and `catchAll`.

A listener is used via its `call` method, which is responsible for testing to see if a message matches (`match` is an abstract method) and if so, executes the listener's callback.

Listener callbacks are assumed to be synchronous.

## Middleware

There are two primary entry points for middleware:

1. `robot.listenerMiddleware` - registers a new piece of middleware in a global array
2. `middleware.execute` - executes all registered middleware in order
