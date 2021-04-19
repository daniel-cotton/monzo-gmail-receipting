const moment = require("moment");

const Receipt = require("../../../model/Receipt");
const ReceiptItem = require("../../../model/ReceiptItem");
const ReceiptTax = require("../../../model/ReceiptTax");
const ReceiptMerchant = require("../../../model/ReceiptMerchant");

const tidyString = str => str.split("\n").join("").split("  ").join("");
const priceToPennies = price => price && price.split("£")[1] && Number(price.split("£")[1].split(".")[0]) * 100 + Number(price.split(".")[1]);

const AmazonMerchant = new ReceiptMerchant("Amazon", true);

module.exports = $ => {
  try {
    const metadata = {
      orderID: $("*[id$='orderDetails'] a[href$='order']").text(),
      date: moment($("*[id$='orderDetails'] span").text().split("Placed on ")[1], 'MMMM D, YYYY').toDate(),
      totalCost: priceToPennies($("*[id$='costBreakdown'] tr td[class$='total']:last-child strong").text())
    }
  
    if (metadata.orderID && metadata.date && (metadata.preTax || metadata.tax || metadata.totalCost)) {
      let items = []
      $("*[id$='itemDetails'] > tbody > tr").each(function(i, elem) {
        const data = {
          price: priceToPennies($(this).find("*[class$='price']").text().trim()),
          name: tidyString($(this).find("*[class$='name']").text()).trim(),
          quantity: Number($(this).find("*[class$='name'] b").text().split(" x")[0]) || 1
        };
        items.push(new ReceiptItem(data.name, data.quantity, null, data.price, null, "GBP", []));
      });
      const taxes = [
        new ReceiptTax("VAT", metadata.tax, "GBP")
      ]
      const amazonReceipt = new Receipt("txID", metadata.orderID, metadata.preTax || metadata.totalCost, "GBP", items, metadata.tax ? taxes : [], [], AmazonMerchant);
      return {
        receipt: amazonReceipt,
        metadata,
        totalCost: metadata.totalCost || (metadata.preTax + metadata.tax)
      };
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null
  }
}