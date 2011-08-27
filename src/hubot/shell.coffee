Robot = require 'robot'

class Shell extends Robot
	send: (user, strings...) ->
		strings.forEach (str) ->
			console.log str

	reply: (user, strings...) ->
		strings.forEach (str) =>
			@send user, "#{user.name}: #{str}"

 run: ->
    self = @
    process.openStdin().on 'data', (txt) ->
      txt.toString().split("\n").forEach (line) ->
        return if line.length == 0
        self.receive(
          text: line
          user: { name: 'shell', id: 0 }
        )

exports.Shell = Shell
