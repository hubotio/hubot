// Description:
//   a bot that tells you something.
//
// Dependencies:
//
// Configuration:
//
// Commands:
//   hubot <something> - will just respond.
//
// Notes:
//   Make this good
//
// Author:
//   J0ey Guerra

class Option {
  constructor (title, description, link) {
    this.title = title
    this.description = description
    this.link = link
  }
  toString () {
    return `How 'bout ${this.title}. ${this.description} @ ${this.link}`
  }
}

const dallasLunchOptions = [
  new Option('Village Burger Bar', 'Serves burgers and fries', 'https://www.yelp.com/biz/village-burger-bar-dallas?osq=Village+Burger+Bar'),
  new Option('Taqueria La Ventana', 'Serves tacos', 'https://www.yelp.com/biz/taqueria-la-ventana-dallas-4'),
  new Option('Roti', 'Serves Mediterranean', 'https://www.yelp.com/biz/roti-modern-mediterranean-dallas'),
  new Option('Shake Shack', 'Serves burgers and shakes', 'https://www.yelp.com/biz/shake-shack-dallas'),
  new Option('Pei Wei', 'Serves Asian fusion', 'https://www.yelp.com/biz/pei-wei-dallas-7'),
  new Option('Mixt', 'Serves salads', 'https://www.yelp.com/biz/mixt-dallas-2'),
  new Option('The Henry', 'Serves various American', 'https://www.yelp.com/biz/the-henry-dallas-2'),
  new Option('Sammy\'s Bar-B-Q', 'Serves barbeque', 'https://www.yelp.com/biz/sammys-bar-b-q-dallas')
]

const randomFrom = options => options[Math.floor(Math.random() * options.length)]

module.exports = robot => {
  robot.respond(/lunch/i, async resp => {
    const selectedLunch = randomFrom(dallasLunchOptions)
    const otherLunchOptions = dallasLunchOptions.filter(option => option !== selectedLunch)
    robot.logger.log(otherLunchOptions)
    await resp.reply(selectedLunch.toString())
  })
}
