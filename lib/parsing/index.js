const cheerio = require('cheerio');

const { transactions, receipts } = require("../api/monzo");

const parsers = require("./parsers");

module.exports = class ParsedEmail {
  constructor(html) {
    this.$ = cheerio.load(html);
    const result = parsers.reduce((result, parser) => result || parser(this.$), null);
    if (!result) {
      return;
    } else {
      const { receipt, metadata, totalCost } = result;
      let since = new Date(metadata.date);
      since.setDate(since.getDate() - 1);
      since.setHours(0);
      let before = new Date(metadata.date); 
      before.setHours(23, 59, 59);
      before.setDate(before.getDate() + 5);
      const q = {
        since: since.toISOString(),
        before: before.toISOString()
      };

      console.log("[PARSER] Valid Receipt, attempting monzo query");
        
      transactions.query(process.env.MONZO_ACCOUNT, q)
        .then(results => results.transactions && results.transactions.find(transaction => transaction.amount === -totalCost))
        .then(result => {
          if (!result) {
            console.log("[MONZO] Failed to find transaction for merchant: " + receipt.merchant.name);
            // Can't be found in monzo!
            return;
          }
          receipt.txID = result.id;
          console.log("[PARSE] Pre-create: ", q);
          return receipts.create(receipt)
            // .then(console.log);
        })
        .catch(console.error);
    }
    
  }
}
