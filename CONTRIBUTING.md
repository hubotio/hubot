# Contributing

This project adheres to the [Open Code of Conduct][code-of-conduct]. By participating, you are expected to uphold this code.
[code-of-conduct]: http://todogroup.org/opencodeofconduct/#Hubot/opensource@github.com

We love pull requests. Here's a quick guide:

1. Check for [existing issues](https://github.com/github/hubot/issues) for duplicates and confirm that it hasn't been fixed already in the [master branch](https://github.com/github/hubot/commits/master)
2. Fork the repo, and clone it locally
3. `npm link` to make your cloned repo available to npm
4. Follow [Getting Started](docs/index.md) to generate a testbot
5. `npm link hubot` in your newly created bot to use your hubot fork
6. Create a new branch for your contribution
7. Add [tests](test/) (run with `npm test`)
8. Push to your fork and submit a pull request

At this point you're waiting on us. We like to at least comment on, if not
accept, pull requests within a few days. We may suggest some changes or improvements or alternatives.

Some things that will increase the chance that your pull request is accepted:

* Use CoffeeScript [idioms](http://arcturo.github.io/library/coffeescript/04_idioms.html) and [style guide](https://github.com/polarmobile/coffeescript-style-guide)
* Update the documentation: code comments, example code, guides. Basically,
  update anything is affected by your contribution.
* Include any information that would be relevant to reproducing bugs, use cases for new features, etc.

* Discuss the impact on existing [hubot installs](docs/index.md), [hubot adapters](docs/adapters.md), and [hubot scripts](docs/scripting.md) (e.g. backwards compatibility)
  * If the change does break compatibility, how can it be updated to become backwards compatible, while directing users to the new way of doing things?
* Your commits are associated with your GitHub user: https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/
* Make pull requests against a feature branch,
* Don't update the version in `package.json`, as the maintainers will manage that in a follow-up PR to release

Syntax:

  * Two spaces, no tabs.
  * No trailing whitespace. Blank lines should not have any space.
  * Prefer `and` and `or` over `&&` and `||`
  * Prefer single quotes over double quotes unless interpolating strings.
  * `MyClass.myMethod(my_arg)` not `myMethod( my_arg )` or `myMethod my_arg`.
  * `a = b` and not `a=b`.
  * Follow the conventions you see used in the source already.

# Releasing

This section is for maintainers of hubot. Here's the current process for releasing:

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
