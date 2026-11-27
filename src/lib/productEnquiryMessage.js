export function getProductEnquiryMessage(product, contact = {}) {
  const lines = [
    'Hi,',
    '',
    'I would like to enquire about the following product:',
    '',
    `Product: ${product.title}`
  ];

  if (product.sku) lines.push(`SKU: ${product.sku}`);
  if (contact.name || contact.phone || contact.email) {
    lines.push(
      '',
      'Customer details:',
      ...(contact.name ? [`Name: ${contact.name}`] : []),
      ...(contact.phone ? [`Phone: ${contact.phone}`] : []),
      ...(contact.email ? [`Email: ${contact.email}`] : [])
    );
  }

  lines.push(
    '',
    'Could you please confirm its availability and provide a quotation?',
    '',
    'Thank you.'
  );
  return lines.join('\n');
}
