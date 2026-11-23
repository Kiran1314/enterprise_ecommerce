import dbConnect from '@/lib/dbConnect';
import { getProductAvailableStock } from '@/lib/productAvailability';
import { getProductPricing } from '@/lib/productPricing';
import { SITE_URL } from '@/lib/siteUrl';
import Product from '@/models/Product';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

const escapeXml = value => String(value ?? '').replace(/[<>&'"]/g, character => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;'
})[character]);

function getAbsoluteImageUrl(image) {
  if (!image) return '';
  try {
    return new URL(image, SITE_URL).toString();
  } catch {
    return '';
  }
}

function getProductDescription(description) {
  return String(description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

function formatPrice(value, currency) {
  const fractionDigits = new Intl.NumberFormat('en', {
    style: 'currency',
    currency
  }).resolvedOptions().maximumFractionDigits;
  return `${Number(value).toFixed(fractionDigits)} ${currency}`;
}

function toFeedItem(product, currency) {
  const pricing = getProductPricing(product);
  const brand = product.brand?.name?.trim();
  const images = (product.images || []).map(getAbsoluteImageUrl).filter(Boolean);

  if (!product.slug || !product.sku || !product.title || !getProductDescription(product.description) ||
      !brand || !images.length || pricing.price === null) {
    return null;
  }

  const title = product.title.toLowerCase().includes(product.sku.toLowerCase())
    ? product.title
    : `${product.title} (${product.sku})`;
  const entries = [
    ['id', product.sku],
    ['title', title.slice(0, 150)],
    ['description', getProductDescription(product.description)],
    ['link', `${SITE_URL}/products/${encodeURIComponent(product.slug)}`],
    ['image_link', images[0]],
    ['availability', getProductAvailableStock(product) > 0 ? 'in_stock' : 'out_of_stock'],
    ['price', formatPrice(pricing.price, currency)],
    ['condition', 'new'],
    ['brand', brand],
    ['mpn', product.sku]
  ];

  if (pricing.hasOffer) {
    entries.push(['sale_price', formatPrice(pricing.offerPrice, currency)]);
  }
  images.slice(1, 11).forEach(image => entries.push(['additional_image_link', image]));

  return `<item>${entries.map(([key, value]) => `<g:${key}>${escapeXml(value)}</g:${key}>`).join('')}</item>`;
}

export async function GET() {
  await dbConnect();
  const [settings, products] = await Promise.all([
    Settings.findOne({}).select('currencyCode').lean(),
    Product.find({ isDemoData: { $ne: true } })
      .select('title sku slug description price offerPrice stock images brand fitments')
      .populate('brand', 'name')
      .lean()
  ]);

  const currency = settings?.currencyCode || 'USD';
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`Invalid store currency code for Google Merchant feed: ${currency}`);
  }

  const items = products.map(product => toFeedItem(product, currency)).filter(Boolean);
  const skippedCount = products.length - items.length;
  if (skippedCount > 0) {
    console.warn(`Google Merchant feed skipped ${skippedCount} products missing required listing data.`);
  }

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Super RF Japan Product Catalog</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Super RF Japan automotive spare parts catalog</description>
    ${items.join('\n    ')}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300'
    }
  });
}
