OptParse = require 'optparse'

class Options
  constructor: (argv) ->
    argv or= []

    @adapter= "shell"
    @alias= false
    @create= false
    @enableHttpd= true
    @scripts= []
    @name= "Hubot"
    @path= "."
    @help= false

    switches = [
      [ '-a', '--adapter ADAPTER', 'Adapter name for hubot to use' ]
      [ '-b', '--brain BRAIN', 'Brain for hubot to use' ]
      [ '-c', '--create PATH', 'Path to create your new hubot' ]
      [ '-d', '--disable-httpd', 'Disable the internal HTTP server' ]
      [ '-h', '--help', 'Display hubot usage' ]
      [ '-l', '--alias ALIAS', 'Alias name for your hubot' ]
      [ '-n', '--name NAME', 'Name for your hubot' ]
      [ '-v', '--version', 'Display hubot version' ]
    ]
    parser = new OptParse.OptionParser(switches)
    parser.banner = "Usage hubot [options]"

    parser.on "adapter", (opt, value) =>
      @adapter = value

    parser.on "create", (opt, value) =>
      @path = value if value
      @create = true

    parser.on "disable-httpd", (opt) =>
      @enableHttpd = false

    # FIXME don't exit here
    parser.on "help", (opt, value) =>
      @help= parser.toString()

    parser.on "alias", (opt, value) =>
      value or= '/'
      @alias = value

    parser.on "name", (opt, value) =>
      @name = value

    parser.on "require", (opt, value) =>
      @scripts.push(value)

    parser.on "version", (opt, value) =>
      @version = true

    parser.parse argv

module.exports = Options
