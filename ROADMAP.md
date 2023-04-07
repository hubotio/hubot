# Hubot Roadmap

Hubot aims to be a bot framework optimized for developers and developer workflows, with great integration with the most popular chat clients and developer tools, and an active community that is sharing scripts and best practices.

This roadmap represents some priorities for us over the next couple months. Issues or pull requests will be opened to discuss each of these items as they progress.

## 1. Return to a “maintained” status

- [x] Create a Hubot core team with invested users with no direct connection, interested in continuing the #hubot project.
- [x] Review all [open PRs](https://github.com/github/hubot/pulls) and triage [open issues](https://github.com/github/hubot/issues)
- [ ] Document all maintainer processes (triage, release, etc.)
- [ ] Create an issue template that addresses common requests
- [ ] Establish a release process and regular release cadence.

## 2. Modernize the community

- [x] Create Hubot Evolution—inspired by [Swift Evolution](https://github.com/apple/swift-evolution)—for proposing user-visible enhancements. ([hubotio/evolution#1](https://github.com/hubotio/evolution/pull/1))
- [ ] Review and update the [contributing guide](CONTRIBUTING.md)
- [ ] Review hubot scripts and discuss whether or not we should fork them into this org or not.
- [ ] Do we want a chat community for Hubot?
- [ ] Review the [code of conduct](CODE_OF_CONDUCT.md) based on http://contributor-covenant.org/
- [ ] Decide on setting up Github Pages

## 3. Modernize the project

- Update to modern versions of Node.js
- Revisit new bot generator (yeoman has a ton of dependencies, some of which can be error prone on windows)
- Support for running multiple adapters and archetypes (chat, deployment, CI, github, etc)
- Discuss introducing the `Commands` concept as an interface for registering commands (like Slack’s slash commands) as an alternative to regular expressions
- Discuss publishing a ChatOps RPC spec and implement support for Hubot acting as both a client and a server.
- Support rich messages and interactions on platforms that support it
- Publish a public script directory backed by NPM
