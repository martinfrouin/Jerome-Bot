const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const moment = require('moment')
const app = express()
require('moment/locale/fr')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

console.log(process.env.VERIFY_TOKEN, process.env.PAGE_ACCESS_TOKEN)
const weekEnd = ['weekend', 'we', 'week end', 'week-end']
const hello = ['hello', 'salut', 'bonjour', 'coucou']

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    'Express server listening on port %d in %s mode',
    server.address().port,
    app.settings.env
  )
})

function getNextWeekend() {
  const now = moment().locale('fr')

  const deadlineFrom = moment()
    .isoWeekday(5)
    .set({ h: 18, m: 0, s: 0 })
  const deadlineTo = moment()
    .isoWeekday(5)
    .add(3, 'days')
    .set({ h: 8, m: 0, s: 0 })

  if (now >= deadlineFrom && now <= deadlineTo)
    return `C'est le week-end !\nhttps://www.youtube.com/watch?v=Meb7uaNlcS0`
  return `C'est ${deadlineFrom.from(now)}`
}

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] &&
    req.query['hub.verify_token'] === process.env.VERIFY_TOKEN
  ) {
    res.status(200).send(req.query['hub.challenge'])
  } else {
    res.status(403).end()
  }
})

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  console.log(req.body)
  if (req.body.object === 'page') {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && event.message.text) {
          if (
            new RegExp(weekEnd.join('|')).test(event.message.text.toLowerCase())
          )
            sendMessage(event.sender.id, getNextWeekend())
          else if (
            new RegExp(hello.join('|')).test(event.message.text.toLowerCase())
          )
            sendMessage(event.sender.id, `Salut`)
        }
      })
    })
    res.status(200).end()
  }
})

function sendMessage(senderId, message) {
  request(
    {
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: 'POST',
      json: {
        recipient: { id: senderId },
        message: { text: message }
      }
    },
    function(error, response) {
      if (error) {
        console.log('Error sending message: ', error)
      } else if (response.body.error) {
        console.log('Error: ', response.body.error)
      }
    }
  )
}
