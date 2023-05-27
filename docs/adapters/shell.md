---
permalink: /docs/adapters/shell/
---

# Shell adapter

The shell adapter provides a simple read-eval-print loop for interacting with a botforge locally.
It can be useful for testing scripts before using them on a live botforge.

## Getting Started

To use the shell adapter you can simply omit the `-a` option when running
botforge as it will use the shell adapter by default.

    % bin/botforge

## Configuring

This adapter doesn't require any configuration.

It supports two environment variables to make it possible to test scripts as different users:

* BOTFORGE_SHELL_USER_ID: default is 1
* BOTFORGE_SHELL_USER_NAME: default is Shell
