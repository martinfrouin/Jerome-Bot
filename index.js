const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const moment = require("moment");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log(process.env.VERIFY_TOKEN, process.env.PAGE_ACCESS_TOKEN);
const weekEnd = [
  "weekEnd",
  "WE",
  "Week End",
  "Week-End",
  "weekend",
  "week-end",
  "Week end",
  "Weekend"
];

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    "Express server listening on port %d in %s mode",
    server.address().port,
    app.settings.env
  );
});

function getNextFriday() {
  return moment.weekdays(5);
}

/* For Facebook Validation */
app.get("/webhook", (req, res) => {
  if (
    req.query["hub.mode"] &&
    req.query["hub.verify_token"] === process.env.VERIFY_TOKEN
  ) {
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post("/webhook", (req, res) => {
  console.log(req.body);
  if (req.body.object === "page") {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && event.message.text) {
          if (weekEnd.indexOf(event.message.text) !== -1) {
            sendMessage(event.sender.id, `C'est dans ${getNextFriday()} jours`);
          } else {
            sendMessage(event.sender.id, "Pas compris");
          }
        }
      });
    });
    res.status(200).end();
  }
});

function sendMessage(senderId, message) {
  request(
    {
      url: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: {
        recipient: { id: senderId },
        message: { text: message }
      }
    },
    function(error, response) {
      if (error) {
        console.log("Error sending message: ", error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      }
    }
  );
}
