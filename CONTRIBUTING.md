# Contributing

Everyone is welcome to contribute to Hubot. Contributing doesn’t just mean submitting pull requests—there are many different ways for you to get involved, including answering questions in [chat](https://hubot-slackin.herokuapp.com/), reporting or triaging [issues](https://github.com/github/hubot/issues), and participating in the [Hubot Evolution](https://github.com/hubotio/evolution) process.

No matter how you want to get involved, we ask that you first learn what’s expected of anyone who participates in the project by reading the [Contributor Covenant Code of Conduct](http://contributor-covenant.org). By participating, you are expected to uphold this code.

We love pull requests. Here's a quick guide:

1. If you're adding a new feature or changing user-facing APIs, check out the [Hubot Evolution](https://github.com/hubotio/evolution) process.
1. Check for [existing issues](https://github.com/github/hubot/issues) for duplicates and confirm that it hasn't been fixed already in the [master branch](https://github.com/github/hubot/commits/master)
1. Fork the repo, and clone it locally
1. `npm link` to make your cloned repo available to npm
1. Follow [Getting Started](docs/index.md) to generate a testbot
1. `npm link hubot` in your newly created bot to use your hubot fork
1. Create a new branch for your contribution
1. Add [tests](test/) (run with `npm test`)
1. Push to your fork and submit a pull request

At this point you're waiting on us. We like to at least comment on, if not
accept, pull requests within a few days. We may suggest some changes or improvements or alternatives.

Some things that will increase the chance that your pull request is accepted:

* Make sure the tests pass
* Update the documentation: code comments, example code, guides. Basically,
  update everything affected by your contribution.
* Include any information that would be relevant to reproducing bugs, use cases for new features, etc.

* Discuss the impact on existing [hubot installs](docs/index.md), [hubot adapters](docs/adapters.md), and [hubot scripts](docs/scripting.md) (e.g. backwards compatibility)
  * If the change does break compatibility, how can it be updated to become backwards compatible, while directing users to the new way of doing things?
* Your commits are associated with your GitHub user: https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/
* Make pull requests against a feature branch,
* Don't update the version in `package.json`, as the maintainers will manage that in a follow-up PR to release

# Stale issue and pull request policy

Issues and pull requests have a shelf life and sometimes they are no longer relevant. All issues and pull requests that have not had any activity for 90 days will be marked as `stale`. Simply leave a comment with information about why it may still be relevant to keep it open. If no activity occurs in the next 7 days, it will be automatically closed.

The goal of this process is to keep the list of open issues and pull requests focused on work that is actionable and important for the maintainers and the community.

# Releasing

This section is for maintainers of Hubot. Here's the current process for releasing:

* review unreleased changes since last release on https://github.com/github/hubot/commits/master
* determine what version to release as:
  * bug or documentation fix? patch release
  * new functionality that is backwards compatible? minor version
  * breaking change? major release, but think about if it can be fixed to be a minor release instead
* create a `release-vX.X.X` branch to release from
* update `package.json`'s `version`
* summarize changes in `CHANGELOG.md` (see https://github.com/github/hubot/blob/master/CHANGELOG.md#v2120 for an example)
* create a pull request, and cc pull requests included in this release, as well as their contributors (see https://github.com/github/hubot/pull/887 as an example)
* merge pull request
* checkout master branch, and run `script/release`
