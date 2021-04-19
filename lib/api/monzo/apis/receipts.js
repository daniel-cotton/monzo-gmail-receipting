
module.exports = class {
  constructor(monzo) {
    this._monzo = monzo;
  }
  create(receipt) {
    console.log("[MONZO] Creating Receipt for: " + receipt.merchant.name);
    const ep = `${this._monzo._baseURL}/transaction-receipts`
    return this._monzo.request(ep, {
      headers: {
        "Content-Type": "application/json"
      },
      method: "PUT",
      body: JSON.stringify(receipt)
    })
    // .then(console.log);
    // .then(r => r.json())
  }
};