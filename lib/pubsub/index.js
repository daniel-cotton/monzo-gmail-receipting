require("dotenv").config();

// Imports the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub');

// Creates a client
const pubsub = new PubSub();

/**
 * TODO(developer): Uncomment the following lines to run the sample.
 */
const subscriptionName = process.env.GMAIL_PUBSUB_SUBSCRIPTION;
const timeout = 60;

// References an existing subscription
const subscription = pubsub.subscription(subscriptionName);

// Create an event handler to handle messages
let handlers = [];

const messageHandler = message => {
  handlers.forEach(handler => handler(message));
  // "Ack" (acknowledge receipt of) the message
  message.ack();
};

// Listen for new messages until timeout is hit
subscription.on(`message`, messageHandler);

module.exports = {
  registerHandler(callback) {
    handlers.push(callback);
  },
}