module.exports = class ReceiptItem {
  constructor(description, quantity, unit, pennyAmount, tax, currency, subItems) {
    Object.assign(this, {
      "description": description,
      "quantity": quantity,
      "unit": unit,
      "amount": pennyAmount,
      "currency": currency || "GBP",
      "tax": tax,
      "sub_items": subItems || []
    });
  }
}