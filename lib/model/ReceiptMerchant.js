module.exports = class ReceiptMerchant {
  constructor(name, online, phone, email, storeName, storeAddress, storePostcode) {
    Object.assign(this, {
      name,
      online,
      phone,
      email,
      store_name: storeName,
      store_address: storeAddress,
      store_postcode: storePostcode
    });
  }
}