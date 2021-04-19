# stern
Automatic Online Receipting for Monzo (via gmail)

## About

This was a project I hacked together in a few days a couple of years prior to making this public.

Unfortunately, due to the lack of maintenance the parsers may be out of date. It's not the most robust thing in the world, more serving as a technical proof of concept.

## Project Structure

The project is built using Node.JS and express.

It leverages gcloud PubSub to retrieve emails on arrival from gmail. Follow this guide in Google's gmail API documentation for full information
https://developers.google.com/gmail/api/guides/push

Receipt emails are then parsed via cheerio's node DOM parser. The parsing logic is managed by a number of plugin-ready parsers (current implementations being for Amazon and PayPal). These implementations may be found in: `./lib/parsing/parsers/commerce/`

There's a basic implementation of a Node.JS client for the Monzo HTTP api that is used for querying transactions and adding receipts.

The project contains an app.yaml as the initial prototype was deployed to Google Cloud App Engine.