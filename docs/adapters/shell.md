---
permalink: /docs/adapters/shell/index.html
layout: docs
---

The shell adapter provides a simple read-eval-print loop for interacting with a hubot locally.
It can be useful for testing scripts before using them on a live hubot.

## Getting Started

To use the shell adapter you can simply omit the `-a` option when running
hubot as it will use the shell adapter by default.

    % bin/hubot

## Configuring

This adapter doesn't require any configuration.

It supports two environment variables to make it possible to test scripts as different users:

* HUBOT_SHELL_USER_ID: default is 1
* HUBOT_SHELL_USER_NAME: default is Shell
