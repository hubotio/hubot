/*!
 * Log.js
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

 var fmt = require('util').format;
 var EventEmitter = require('events').EventEmitter;
 
 /**
  * Initialize a `Loggeer` with the given log `level` defaulting
  * to __DEBUG__ and `stream` defaulting to _stdout_.
  *
  * @param {Number} level
  * @param {Object} stream
  * @api public
  */
 
 class Log extends EventEmitter {
   constructor(level, stream) {
     super();
     if ('string' == typeof level) level = exports[level.toUpperCase()];
     this.level = level || exports.DEBUG;
     this.stream = stream || process.stdout;
     if (this.stream.readable && !this.stream.isTTY) this.read();
   }
   /**
    * Start emitting "line" events.
    *
    * @api public
    */
 
    read(){
      let buf = '';
      this.stream.setEncoding('utf8');
      this.stream.on('data', (chunk) => {
        buf += chunk;
        if ('\n' != buf[buf.length - 1]) return;
        buf.split('\n').map((line) => {
          if (!line.length) return;
          try {
            let captures = line.match(/^\[([^\]]+)\] (\w+) (.*)/);
            let obj = {
                date: new Date(captures[1])
              , level: exports[captures[2]]
              , levelString: captures[2]
              , msg: captures[3]
            };
            this.emit('line', obj);
          } catch (err) {
            // Ignore
          }
        });
        buf = '';
      });

      this.stream.on('end', function(){
        this.emit('end');
      });
    }
  
    /**
     * Log output message.
     *
     * @param  {String} levelStr
     * @param  {Array} args
     * @api private
     */
  
    log(levelStr, args) {
      if (exports[levelStr] <= this.level) {
        var msg = fmt.apply(null, args);
        this.stream.write(
            '[' + new Date + ']'
          + ' ' + levelStr
          + ' ' + msg
          + '\n'
        );
      }
    }
  
    /**
     * Log emergency `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    emergency(msg){
      this.log('EMERGENCY', arguments);
    }
  
    /**
     * Log alert `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    alert(msg){
      this.log('ALERT', arguments);
    }
  
    /**
     * Log critical `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    critical(msg){
      this.log('CRITICAL', arguments);
    }
  
    /**
     * Log error `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    error(msg){
      this.log('ERROR', arguments);
    }
  
    /**
     * Log warning `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    warning(msg){
      this.log('WARNING', arguments);
    }
  
    /**
     * Log notice `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    notice(msg){
      this.log('NOTICE', arguments);
    }
  
    /**
     * Log info `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    info(msg){
      this.log('INFO', arguments);
    }
  
    /**
     * Log debug `msg`.
     *
     * @param  {String} msg
     * @api public
     */
  
    debug(msg){
      this.log('DEBUG', arguments);
    }
 }
 
 /**
  * System is unusable.
  *
  * @type Number
  */
 
 exports.EMERGENCY = 0;
 
 /**
  * Action must be taken immediately.
  *
  * @type Number
  */
 
 exports.ALERT = 1;
 
 /**
  * Critical condition.
  *
  * @type Number
  */
 
 exports.CRITICAL = 2;
 
 /**
  * Error condition.
  *
  * @type Number
  */
 
 exports.ERROR = 3;
 
 /**
  * Warning condition.
  *
  * @type Number
  */
 
 exports.WARNING = 4;
 
 /**
  * Normal but significant condition.
  *
  * @type Number
  */
 
 exports.NOTICE = 5;
 
 /**
  * Purely informational message.
  *
  * @type Number
  */
 
 exports.INFO = 6;
 
 /**
  * Application debug messages.
  *
  * @type Number
  */
 
 exports.DEBUG = 7;
 
 module.exports = Log;