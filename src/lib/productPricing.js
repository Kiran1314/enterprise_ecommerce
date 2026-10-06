export function getProductPricing(product) {
  const price = Number(product?.price);
  if (product?.price === null || product?.price === undefined || product.price === '' || !Number.isFinite(price) || price <= 0) {
    return { price: null, offerPrice: null, hasOffer: false, displayPrice: null };
  }

  const offerPrice = Number(product.offerPrice);
  const hasOffer = product.offerPrice !== null && product.offerPrice !== undefined && product.offerPrice !== '' && Number.isFinite(offerPrice) && offerPrice > 0 && offerPrice < price;
  return { price, offerPrice: hasOffer ? offerPrice : null, hasOffer, displayPrice: hasOffer ? offerPrice : price };
}