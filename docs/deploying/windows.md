---
permalink: /docs/deploying/windows/index.html
layout: docs
---
There are 4 primary steps to deploying and running hubot on a Windows machine:

  * node and npm
  * a way to get source code updated on the server
  * setting up environment variables for hubot
  * a way to start hubot, start it up if it crashes, and restart it when code updates

# PowerShell Module

A PowerShell Module called `PoshHubot` is available which will allow you to install and configure Hubot for Windows with a few commands.

If you have PowerShell v5 installed you can simple run the following command to install the module:

```
Install-Module -Name PoshHubot
```
Details about using Hubot on Windows with PowerShell can be found in this blog post: https://hodgkins.io/chatops-on-windows-with-hubot-and-powershell

# Manually
Hasn't been fully tested - YMMV
## node and npm

To start, your Windows server will need node and npm.

### Use Chocolatey to Install Node.js
One way to easily install node.js is with [chocolatey](http://chocolatey.org) using the [nodejs.install](http://chocolatey.org/packages/nodejs.install) package.

Once installed, ensure you can run node/npm from the command line. If needed, set the PATH variable with
```
SET PATH=%PATH%;C:\Program Files\Nodejs
```

### Install Node.js Manually

Your other option is to install directly from [NodeJS](https://nodejs.org/) and run the current download (v0.12.4 as of this documentation). This should set your PATH variables for you.

## Updating code on the server

To get the code on your server, you can follow the instructions at [Getting Started](/docs/index.md) on your local development machine or directly on the server. If you are building locally, push your hubot to GitHub and clone the repo onto your server. Don't clone the normal [github/hubot repository](http://github.com/github/hubot), make sure you're using the Yo Generator to build your own hubot.

## Setting up environment vars

You will want to set up your hubot environment variables on the server where it will run. You can do this by opening an administrative PowerShell and typing the following:

    [Environment]::SetEnvironmentVariable("HUBOT_ADAPTER", "Campfire", "Machine")

This is equivalent to going into the system menu -> selecting advanced system settings -> environment vars and adding a new system variable called HUBOT_ADAPTER with the value of Campfire.

## Starting, stopping, and restarting hubot

Every hubot install has a `bin/hubot` script to handle starting up the hubot.
You can run this command directly from your hubot folder by typing the following:

    .\bin\hubot –adapter campfire

There are a few issues if you call it manually, though.

* you disconnect, and hubot dies
* hubot dies, for any reason, and doesn't start again
* it doesn't start up at boot automatically

To fix this, you will want to create a .ps1 file with whatever name makes you happy that you will call from your hubot directory. There is a copy of this file in the `examples` directory [here](/examples/hubot-start.ps1). It should contain the following:

    Write-Host "Starting Hubot Watcher"
    While (1)
    {
        Write-Host "Starting Hubot"
        Start-Process powershell -ArgumentList ".\bin\hubot –adapter slack" -wait
    }

Remember to allow local unsigned PowerShell scripts if you are using the .ps1 file to run hubot. Run this command in an Administrator PowerShell window.

    Set-ExecutionPolicy RemoteSigned

You can set this .ps1 as scheduled task on boot if you like or some other way to start your process.

## Expanding the documentation

Not yet fleshed out. [Help contribute by submitting a pull request, please?](https://github.com/github/hubot/pull/new/master)
