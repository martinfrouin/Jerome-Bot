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
  var dayINeed = 5;

  var deadline;

  // if we haven't yet passed the day of the week that I need:
  if (moment().isoWeekday() <= dayINeed) {
    // then just give me this week's instance of that day
    deadline = moment().isoWeekday(dayINeed);
  } else {
    // otherwise, give me next week's instance of that day
    deadline = moment()
      .add(1, "weeks")
      .isoWeekday(dayINeed);
  }
  deadline.startOf("day").set({ h: 17 });
  const now = moment();
  const days = deadline.diff(now, "days");
  const hours = deadline.subtract(days, "days").diff(now, "hours");
  const minutes = deadline.subtract(hours, "hours").diff(now, "minutes");
  return `${days !== 0 && `${days} jours,`} ${hours !== 0 &&
    `${hours} heures et `} ${minutes && `${minutes} minutes`}`;
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
          if (new RegExp(weekEnd.join("|")).test(event.message.text)) {
            sendMessage(event.sender.id, `C'est dans ${getNextFriday()}`);
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
