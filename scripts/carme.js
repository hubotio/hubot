// Description:
//   Get some tumblr tag
//
// Dependencies:
//   None
//
// Configuration:
//   export TUMBLR_API_KEY='YOURAPIKEY'
//
// Commands:
//   hubot carme "sometag"
module.exports = function(robot) {
    robot.hear(/carme (.*)/i, function(res){
      var cartag = res.match[1];
      var tumblr = require('tumblr.js');
      var apikey = process.env.TUMBLR_API_KEY;
      console.log(apikey);
      var client = tumblr.createClient({ consumer_key: apikey });

      client.tagged(cartag, { limit: 1 }, function (err, data) {
          console.log(data);
          res.reply(data[0].image_permalink);
      });
    });
}
