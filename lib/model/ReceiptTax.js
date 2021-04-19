module.exports = class ReceiptTax {
  constructor(description, amount, currency, taxNumber) {
    Object.assign(this, {
        "description": description,
        "amount": amount,
        "currency": currency || "GBP",
        "tax_number": taxNumber
    });
  }
}