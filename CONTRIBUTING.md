We love pull requests. Here's a quick guide:

1. Check for [existing issues](https://github.com/github/hubot/issues) for duplicates and confirm that it hasn't been fixed already in the [master branch](https://github.com/github/hubot/tree/master)
2. Fork the repo, and clone it locally
3. `npm link` to make your cloned repo available to npm
4. `hubot --create testbot` to create a bot to test againt (no automated tests yet :sob:)
5. `npm install && npm link hubot` in your testbot to install dependencies, and use your hubot fork
6. Push to your fork and submit a pull request.

At this point you're waiting on us. We like to at least comment on, if not
accept, pull requests within a few days. We may suggest some changes or improvements or alternatives.

Some things that will increase the chance that your pull request is accepted:

* Use Coffeescript idioms
* Update the documentation, the surrounding one, examples elsewhere, guides,
  whatever is affected by your contribution
* Include any information that would be relevant to reproducing bugs, use cases for new features, etc

Syntax:

* Two spaces, no tabs.
* No trailing whitespace. Blank lines should not have any space.
* Prefer `and` and `or` over `&&` and `||`
* `MyClass.my_method(my_arg)` not `my_method( my_arg )` or `my_method my_arg`.
* `a = b` and not `a=b`.
* Follow the conventions you see used in the source already.
