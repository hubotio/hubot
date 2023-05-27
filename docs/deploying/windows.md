---
permalink: /docs/deploying/windows/
---

# Deploying to Windows

Hasn't been fully tested - YMMV

There are 4 primary steps to deploying and running botforge on a Windows machine:

* node and npm
* a way to get source code updated on the server
* setting up environment variables for botforge
* a way to start botforge, start it up if it crashes, and restart it when code updates

## node and npm

To start, your windows server will need node and npm.
The best way to do this is with [chocolatey](http://chocolatey.org) using the [nodejs.install](http://chocolatey.org/packages/nodejs.install) package.
I've found that sometimes the system path variable is not correctly set; ensure you can run node/npm from the command line. If needed set the PATH variable with `set PATH=%PATH%;\"C:\Program Files\nodejs\"`

Your other option is to install directly from [NodeJS](https://nodejs.org/) and run the current download (v0.12.4 as of this documentation). This should set your PATH variables for you.

## Updating code on the server

To get the code on your server, you can follow the instructions at [Getting Started](../index.md) on your local development machine or directly on the server. If you are building locally, push your botforge to GitHub and clone the repo onto your server. Don't clone the normal [hubot-new/botforge repository](http://github.com/hubot-new/botforge), make sure you're using the Yo Generator to build your own botforge.

## Setting up environment vars

You will want to set up your botforge environment variables on the server where it will run. You can do this by opening an administrative PowerShell and typing the following:

    [Environment]::SetEnvironmentVariable("BOTFORGE_ADAPTER", "Campfire", "Machine")

This is equivalent to going into the system menu -> selecting advanced system settings -> environment vars and adding a new system variable called BOTFORGE_ADAPTER with the value of Campfire.

## Starting, stopping, and restarting botforge

Every botforge install has a `bin/botforge` script to handle starting up the botforge.
You can run this command directly from your botforge folder by typing the following:

    .\bin\botforge –adapter campfire

There are a few issues if you call it manually, though.

* you disconnect, and botforge dies
* botforge dies, for any reason, and doesn't start again
* it doesn't start up at boot automatically

To fix this, you will want to create a .ps1 file with whatever name makes you happy that you will call from your botforge directory. There is a copy of this file in the `examples` directory [here](../../examples/botforge-start.ps1). It should contain the following:

    Write-Host "Starting Botforge Watcher"
    While (1)
    {
        Write-Host "Starting Botforge"
        Start-Process powershell -ArgumentList ".\bin\botforge –adapter slack" -wait
    }

Remember to allow local unsigned PowerShell scripts if you are using the .ps1 file to run botforge. Run this command in an Administrator PowerShell window.

    Set-ExecutionPolicy RemoteSigned

You can set this .ps1 as scheduled task on boot if you like or some other way to start your process.

## Expanding the documentation

Not yet fleshed out. [Help contribute by submitting a pull request, please?](https://github.com/hubot-new/botforge/pull/new/main)
