module.exports = class Receipt {
  constructor(txID, externalID, totalCostPennies, currency, items, taxes, payments, merchant) {
    Object.assign(this, {
      "transaction_id": txID,
      "external_id": externalID,
      "total": totalCostPennies,
      "currency": currency || "GBP",
      "items": items,
      "taxes": taxes,
      "payments": payments,
      "merchant": merchant
    });
  }
  set txID(txID) {
    this.transaction_id = txID;
  }
}