import { cache } from 'react';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import { getProductAvailableStock } from '@/lib/productAvailability';
import { getProductPricing } from '@/lib/productPricing';
import { SITE_URL } from '@/lib/siteUrl';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

const getProductBySlug = cache(async slug => {
  await dbConnect();
  let product = await Product.findOne({ slug }).populate('brand', 'name').lean();

  if (!product && /^[0-9a-fA-F]{24}$/.test(slug)) {
    product = await Product.findById(slug).populate('brand', 'name').lean();
  }

  return product;
});

function getProductDescription(product) {
  return String(product.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductImageUrl(image) {
  if (!image) return undefined;
  try {
    return new URL(image, SITE_URL).toString();
  } catch {
    return undefined;
  }
}

function getProductUrl(slug) {
  return `${SITE_URL}/products/${encodeURIComponent(slug)}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found', robots: { index: false, follow: true } };
  }

  const description = getProductDescription(product) || `${product.title} - ${product.sku}`;
  const canonicalUrl = getProductUrl(product.slug || slug);
  const image = product.images?.map(getProductImageUrl).find(Boolean);

  return {
    title: `${product.title} (${product.sku}) | Super RF Japan`,
    description: (description || `${product.title} - ${product.sku}`).slice(0, 160),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${product.title} (${product.sku})`,
      description,
      url: canonicalUrl,
      ...(image ? { images: [image] } : {})
    }
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const settings = await Settings.findOne({}).select('currencyCode').lean();
  const pricing = getProductPricing(product);
  const productUrl = getProductUrl(product.slug || slug);
  const images = product.images?.map(getProductImageUrl).filter(Boolean) || [];
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: images,
    description: getProductDescription(product),
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'Super RF Japan'
    },
    ...(pricing.displayPrice !== null ? {
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: settings?.currencyCode || 'USD',
        price: pricing.displayPrice,
        itemCondition: 'https://schema.org/NewCondition',
        availability: getProductAvailableStock(product) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock'
      }
    } : {})
  };
  const serializedProduct = JSON.parse(JSON.stringify(product));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, '\\u003c') }}
      />
      <ProductDetailClient
        key={`${String(product._id)}:${slug}`}
        initialProduct={serializedProduct}
        slug={slug}
      />
    </>
  );
}
