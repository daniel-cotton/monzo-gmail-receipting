const Transactions = require("./apis/transactions");
const Receipts = require("./apis/receipts");

const Monzo = require("./monzoAPI");
const api = new Monzo();

module.exports = {
  api,
  transactions: new Transactions(api),
  receipts: new Receipts(api)
}