We love pull requests. Here's a quick guide:

1. Check for [existing issues](https://github.com/github/hubot/issues) for duplicates and confirm that it hasn't been fixed already in the [master branch](https://github.com/github/hubot/commits/master)
2. Fork the repo, and clone it locally
3. `npm link` to make your cloned repo available to npm
4. `hubot --create testbot` to create a bot to test against (no automated tests yet :sob:)
5. `npm install && npm link hubot` in your newly created bot to install dependencies, and use your hubot fork
6. Push to your fork and submit a pull request.

At this point you're waiting on us. We like to at least comment on, if not
accept, pull requests within a few days. We may suggest some changes or improvements or alternatives.

Some things that will increase the chance that your pull request is accepted:

* Use CoffeeScript [idioms](http://arcturo.github.io/library/coffeescript/04_idioms.html) and [style guide](https://github.com/polarmobile/coffeescript-style-guide)
* Update the documentation, the surrounding one, examples elsewhere, guides,
  whatever is affected by your contribution
* Include any information that would be relevant to reproducing bugs, use cases for new features, etc.
* Impact on existing [hubot installs](docs/README.md), [hubot adapters](docs/adapters.md), and [hubot scripts](docs/scripting.md) (e.g. backwards compatibility)

Syntax:

  * Two spaces, no tabs.
  * No trailing whitespace. Blank lines should not have any space.
  * Prefer `and` and `or` over `&&` and `||`
  * Prefer single quotes over double quotes unless interpolating strings.
  * `MyClass.myMethod(my_arg)` not `myMethod( my_arg )` or `myMethod my_arg`.
  * `a = b` and not `a=b`.
  * Follow the conventions you see used in the source already.
