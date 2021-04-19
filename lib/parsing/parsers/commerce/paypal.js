const moment = require("moment");

const Receipt = require("../../../model/Receipt");
const ReceiptItem = require("../../../model/ReceiptItem");
const ReceiptMerchant = require("../../../model/ReceiptMerchant");

const tidyString = str => str.split("\n").join("").split("  ").join("");
const priceToPennies = price => price && price.split("£")[1] && Number(price.split("£")[1].split(".")[0]) * 100 + Number(price.split(".")[1]);

module.exports = $ => {
  try {
    let cartTable = $("table[class$='CartTable']");
    let date = $("*[class$='mobContent'] > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table:nth-child(1) > tbody > tr > td:nth-child(4) > span > span:nth-child(1)").text();
    const metadata = {
      orderID: $("*[class$='mobContent'] > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table:nth-child(1) > tbody > tr > td:nth-child(4) > span > span:nth-child(2) > span > a").text(),
      date: moment(date, 'D MMM YYYY').toDate(),
      totalCost: priceToPennies(cartTable.parent().find("table:nth-child(11) > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(5) > td:nth-child(2)").text().split("GBP")[0])
    }
    const PaypalMerchant = new ReceiptMerchant("Paypal", true);

    if (metadata.orderID && metadata.date && metadata.totalCost) {
      let items = []
      $("table[class$='CartTable'] > tbody > tr[width='40%']").each(function(i, elem) {
        const data = {
          price: priceToPennies($(this).find("td:nth-child(2) span").text().split("GBP")[0].trim()),
          name: tidyString($(this).find("td:first-child").text()).trim(),
          quantity: Number($(this).find("td:nth-child(3)").text()) || 1
        };
        items.push(new ReceiptItem(data.name, data.quantity, null, data.price, null, "GBP", []));
      });
      const paypalReceipt = new Receipt("txID", metadata.orderID, metadata.totalCost, "GBP", items, [], [], PaypalMerchant);
      return {
        receipt: paypalReceipt,
        metadata,
        totalCost: metadata.totalCost
      };
    } else {
      // console.log(metadata);
      return null;
    }
  } catch (e) {
    console.error(e);
    return null
  }
}