require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const gmail = require('./lib/api/gmail');
const Parser = require('./lib/parsing');
const PubSub = require('./lib/pubsub');
const { api } = require("./lib/api/monzo");

app.use(bodyParser.json());

const createGmailSearch = (description, amount, date) => {
  let yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  let tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  return `from:${resolveMerchant(description)} ${amount} after:${yesterday.getFullYear()}/${yesterday.getMonth() + 1}/${yesterday.getDate()} before:${tomorrow.getFullYear()}/${tomorrow.getMonth() + 2}/${tomorrow.getDate()}`;
};

const resolveMerchant = description => {
  if (description.toLowerCase().indexOf("amazon") >= 0) {
    return "Amazon";
  } else {
    return description;
  }
}

// app.post("/webhook", (req, res) => {
//   console.log(req.body);
//   return res.send(200);
// });
let historyId = null;

PubSub.registerHandler(message => {
  let data = JSON.parse(message.data.toString());
  // console.log(data, historyId);
  gmail.getHistory(historyId)
    .then(r => {
      r.data.history.forEach(item => {
        if (item.messagesAdded) {
          item.messagesAdded.forEach(message => {
            gmail.getEmailHTMLByMessageId(message.message.id)
              .then(result => new Parser(result))
              .catch(error => {
                if (error.message === "Absorbable") {
                  // nothing
                } else {
                  console.error(error)
                }
                // res.send();
              })
          })
        }
      })
      // res.json(r);
    })
    .catch(e => {
      console.error(e)
      // res.sendStatus(500).json(e)
    });
  historyId = data.historyId;
})

app.post("/subscribe", (req, res) => {

  gmail.watch({
    "topicName": process.env.GMAIL_PUBSUB_TOPIC,
    "labelIds" :["INBOX"]  
  })
    .then(r => {
      console.log(r);
      res.json(r);
    })
    .catch(e => {
      console.error(e)
      res.sendStatus(500).json(e)
    });
});

app.post("/sync", (req, res) => {

  gmail.getRecentEmails(prom => prom
    .then(email => new Parser(email))
    .catch(error => {
      if (error.message === "Absorbable") {
        // nothing
      } else {
        console.error(error)
      }
      res.send();
    }))
    .catch(error => {
      if (error.message === "Absorbable") {
        // nothing
      } else {
        console.error(error)
      }
      res.send();
    })
});

app.get("/monzo/callback", (req, res) => {
  let { code } = req.query;
  api.resolveCode(code)
    .then(code => res.send());
})


app.post("/monzo/webhook", (req, res) => {
  let event = req.body;
  if (event.type === "transaction.created") {
    const { amount, description, created } = event.data;
    const costString = `£${amount / -100}`;
    const transactionDate =  new Date(created);
    const gmailQuery = createGmailSearch(description, costString, transactionDate);

    gmail.getRecentEmails(prom => prom
      .then(result => new Parser(result))
      .then(() => {
        res.sendStatus(200);
      })
      .catch(error => {
        if (error.message === "Absorbable") {
          // nothing
        } else {
          console.error(error)
        }
      }), gmailQuery)
      .then(() => {
        res.sendStatus(200);
      })
  } else {
    return res.sendStatus(200);
  }
})

  // .then(console.log)

app.listen(process.env.PORT || 3012);