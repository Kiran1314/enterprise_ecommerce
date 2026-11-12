export function getProductAvailableStock(product) {
  if (Array.isArray(product?.fitments) && product.fitments.length > 0) {
    return product.fitments.reduce((total, fitment) => total + (Number(fitment.stock) || 0), 0);
  }

  return Number(product?.stock) || 0;
}
