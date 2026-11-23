import dbConnect from '@/lib/dbConnect';
import Brand from '@/models/Brand';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { SITE_URL } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const staticPages = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.3 }
];

export default async function sitemap() {
  await dbConnect();

  const [categories, brands, products] = await Promise.all([
    Category.find({}).select('slug subcategories.slug updatedAt createdAt').lean(),
    Brand.find({}).select('slug updatedAt createdAt').lean(),
    Product.find({
      isDemoData: { $ne: true }
    }).select('slug updatedAt createdAt').lean()
  ]);

  const urls = staticPages.map(({ path, ...page }) => ({
    url: `${SITE_URL}${path}`,
    ...page
  }));
  const seenPaths = new Set(staticPages.map(({ path }) => path));
  const addCatalogUrl = (path, document) => {
    if (seenPaths.has(path)) return;
    seenPaths.add(path);
    urls.push({
      url: `${SITE_URL}${path}`,
      lastModified: document.updatedAt || document.createdAt,
      changeFrequency: 'weekly',
      priority: 0.7
    });
  };

  categories.forEach(category => {
    if (category.slug) addCatalogUrl(`/categories/${encodeURIComponent(category.slug)}`, category);
    category.subcategories?.forEach(subcategory => {
      if (subcategory.slug) addCatalogUrl(`/categories/${encodeURIComponent(subcategory.slug)}`, category);
    });
  });
  brands.forEach(brand => {
    if (brand.slug) addCatalogUrl(`/brands/${encodeURIComponent(brand.slug)}`, brand);
  });
  products.forEach(product => {
    if (!product.slug) return;
    const path = `/products/${encodeURIComponent(product.slug)}`;
    if (seenPaths.has(path)) return;
    seenPaths.add(path);
    urls.push({
      url: `${SITE_URL}${path}`,
      lastModified: product.updatedAt || product.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8
    });
  });

  return urls;
}