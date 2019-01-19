var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

const ACCESS_TOKEN =
  "EAAijOCZBrbOoBAHyAickzZCTwGSeWzC2gn4UCsqrRriQZBODTTEdFSKBa4sLie8w4zJolv1XTltPx1H18P2DDRkzvhzFHpLKgbIgrWc1coi4gotZCVGe1cWShMeZBnffDxr7MnchmTZCX7rFwG0dpGcisgxD2du4bEGi3aL0DM9AZDZD";

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen(process.env.PORT || 5000);

// Server index page
app.get("/", function(req, res) {
  res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function(req, res) {
  // if (req.query["hub.verify_token"] === process.env.ACCESS_TOKEN) {
  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

function handleMessage(sender_psid, received_message) {
  // Sends the response message
  callSendAPI(sender_psid, received_message.text);
}

// Handles messaging_postbacks events
// function handlePostback(sender_psid, received_postback) {}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

app.post("/webhook", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      // console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      }
      // else if (webhook_event.postback) {
      //   handlePostback(sender_psid, webhook_event.postback);
      // }
    });

    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});
