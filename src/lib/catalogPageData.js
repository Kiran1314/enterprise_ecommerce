import { cache } from 'react';
import dbConnect from '@/lib/dbConnect';
import Brand from '@/models/Brand';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { getProductAvailableStock } from '@/lib/productAvailability';

const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const getCategoryPageData = cache(async slug => {
  await dbConnect();
  const [categories, allProducts] = await Promise.all([
    Category.find({}).sort({ createdAt: -1 }).lean(),
    Product.find({}).populate('brand').sort({ createdAt: -1 }).lean()
  ]);
  const category = categories.find(item => slugify(item.slug || item.name) === slug) || null;
  const subcategory = categories
    .flatMap(item => (item.subcategories || []).map(value => ({ ...value, parentCategory: item })))
    .find(item => slugify(item.slug || item.name) === slug) || null;
  const parentCategory = category || subcategory?.parentCategory || null;
  const targetNames = subcategory
    ? [subcategory.name, subcategory.slug]
    : [category?.name, category?.slug];
  const normalizedTargets = targetNames
    .filter(Boolean)
    .flatMap(value => [String(value).trim().toLowerCase(), slugify(value)]);
  const products = allProducts.filter(product => {
    if (getProductAvailableStock(product) <= 0 || normalizedTargets.length === 0) return false;
    const productCategoryValues = (Array.isArray(product.categories) ? product.categories : [])
      .map(value => String(value || '').trim().toLowerCase());
    return productCategoryValues.some(value =>
      normalizedTargets.includes(value) || normalizedTargets.includes(slugify(value))
    );
  });

  return JSON.parse(JSON.stringify({
    categories,
    category: parentCategory,
    subcategory: subcategory ? { ...subcategory, parentCategory: undefined } : null,
    products
  }));
});

export const getBrandPageData = cache(async slug => {
  await dbConnect();
  const brand = await Brand.findOne({ slug }).lean();
  if (!brand) return null;

  const [categories, allProducts] = await Promise.all([
    Category.find({}).sort({ createdAt: -1 }).lean(),
    Product.find({ brand: brand._id }).populate('brand').sort({ createdAt: -1 }).lean()
  ]);
  const products = allProducts.filter(product => getProductAvailableStock(product) > 0);
  const usedCategories = new Set(products.flatMap(product => product.categories || []));
  const makes = [...new Set(allProducts.flatMap(product =>
    (product.fitments || []).map(fitment => fitment.make).filter(Boolean)
  ))].sort();

  return JSON.parse(JSON.stringify({
    brand,
    categories: categories.filter(category => usedCategories.has(category.name)),
    products,
    makes
  }));
});
