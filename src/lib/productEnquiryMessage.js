export function getProductEnquiryMessage(product) {
  return [
    'Hi,',
    '',
    'I would like to enquire about the following product:',
    '',
    `Product: ${product.title}`,
    `SKU: ${product.sku}`,
    '',
    'Could you please confirm its availability and provide a quotation?',
    '',
    'Thank you.'
  ].join('\n');
}
