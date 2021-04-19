const querystring = require('querystring');

module.exports = class {
  constructor(monzo) {
    this._monzo = monzo;
  }
  query(accountId, query) {
    const querystr = querystring.stringify(Object.assign({}, {
      account_id: accountId
    }, query));
    const ep = `${this._monzo._baseURL}/transactions?${querystr}`
    return this._monzo.request(ep)
    .then(r => r.json())
    // .then(console.log);
  }
};