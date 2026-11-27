function isUsableImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !/^https?:\/\/(?:www\.)?via\.placeholder\.com(?:\/|$)/i.test(value.trim());
}

export function getProductImageUrls(product) {
  const images = (Array.isArray(product?.images) ? product.images : [])
    .filter(isUsableImageUrl)
    .map(image => image.trim());
  if (images.length) return images;

  return (product?.attributes || [])
    .flatMap(attribute => (attribute.options || []).flatMap(option => option.variationImages || []))
    .filter(isUsableImageUrl)
    .map(image => image.trim());
}

export function hasProductImage(product) {
  return getProductImageUrls(product).length > 0;
}
