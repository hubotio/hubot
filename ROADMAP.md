# Hubot Roadmap

Hubot v3 aims to be a bot framework optimized for developers and developer workflows, with great integration with the most popular chat clients and developer tools, and an active community that is sharing scripts and best practices.

This roadmap represents some of priorities for us over the next couple months. Issues or pull requests will be opened to discuss each of these items as they progress.

## 1. Return to a “maintained” status

- [x] Create a Hubot core team with at least 2 GitHub employees and at least 1 community member. The core team is [@technicalpickles](https://github.com/technicalpickles), [@bkeepers](https://github.com/bkeepers), [@mose](https://github.com/mose), and [@gr2m](https://github.com/gr2m) ([#1323](https://github.com/github/hubot/pull/1323))
- [ ] Document all maintainer processes (triage, release, etc.)
- [ ] Create an issue template that addresses common requests
- [ ] Configure automation ([probot stale](https://github.com/probot/stale), [Greenkeeper](https://greenkeeper.io/), [semantic-release](https://github.com/semantic-release/semantic-release))
- [ ] Review all [open PRs](https://github.com/github/hubot/pulls) and triage [open issues](https://github.com/github/hubot/issues)
- [ ] Establish a release process and regular release cadence of the first Tuesday of every month.
- [ ] Establish a first-responder rotation, which will aim to reduce the average time to first response on all new Issues and PRs to 48 hours.

## 2. Modernize the community

- [ ] Consolidate all officially supported Hubot projects into a single GitHub organization. This will include github/hubot and a handful of supported scripts, but will not include all community scripts in https://github.com/hubot-scripts ([#1327](https://github.com/github/hubot/issues/1327))
- [ ] Create a community forum to provide a place for people to ask questions, get help, and share best practices. [Discourse](https://www.discourse.org/) is the obvious choice here.
- [x] Choose a chat platform for maintainers and contributors, and post notices in various existing places (#hubot on freenode, github/hubot on Gitter). Slack is the obvious choice here. [Join us on Slack](https://hubot-slackin.herokuapp.com/).
- [x] Add a code of conduct based on http://contributor-covenant.org/ and processes to enforce it in all official spaces. ([#1334](https://github.com/github/hubot/pull/1334))
- [ ] Publish weekly community updates (blog, newsletter, etc) which highlight recent and upcoming changes, give shoutouts to contributors / maintainers, and maybe mention interesting uses of Hubot
- [x] Create Hubot Evolution—inspired by [Swift Evolution](https://github.com/apple/swift-evolution)—for proposing user-visible enhancements. ([hubotio/evolution#1](https://github.com/hubotio/evolution/pull/1))

## 3. Modernize the project

Each of these proposals will go through the [Hubot Evolution](https://github.com/hubotio/evolution) process.

- Translate from CoffeeScript to JavaScript and update to modern versions of Node.js and NPM (or Yarn)
- Revisit new bot generator (yeoman has a ton of dependencies, some of which can be error prone on windows)
- Support for running multiple adapters and archetypes (chat, deployment, CI, github, etc)
- Merge with [@probot](https://github.com/probot) and build out first class GitHub integration.
- Introduce "Commands”, an explicit interface for registering commands (like Slack’s slash commands) as an alternative to regular expressions
- Publish a ChatOps RPC spec and implement support for Hubot acting as both a client and a server.
- Support rich messages and interactions on platforms that support it
- Publish a public script directory backed by NPM
