import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/dbConnect';
import Banner from '@/models/Banner';
import Brand from '@/models/Brand';
import Category from '@/models/Category';
import GoogleReview from '@/models/GoogleReview';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import { getProductAvailableStock } from '@/lib/productAvailability';

export const getHomePageData = unstable_cache(
  async () => {
    await dbConnect();
    const [banners, categories, allProducts, brands, reviews, settings] = await Promise.all([
      Banner.find({}).sort({ order: 1 }).lean(),
      Category.find({}).sort({ createdAt: -1 }).lean(),
      Product.find({}).populate('brand').sort({ createdAt: -1 }).lean(),
      Brand.find({}).lean(),
      GoogleReview.find({ isDisplayed: true, isDemo: { $ne: true } }).sort({ createdAt: -1 }).limit(6).lean(),
      Settings.findOne({}).select('categorySortMode').lean()
    ]);

    const activeBanners = banners.filter(banner => banner.isActive);
    if (activeBanners.length > 0 && activeBanners.length < 3) {
      while (activeBanners.length < 3) {
        activeBanners.push(...activeBanners.slice(0, 3 - activeBanners.length));
      }
    }

    const inStockProducts = allProducts.filter(product => getProductAvailableStock(product) > 0);
    const spareParts = inStockProducts.filter(product => product.sku?.startsWith('SJ-'));
    const products = spareParts.length > 0 ? spareParts : inStockProducts;
    const storefrontBrandIds = new Set(products.map(product => String(product.brand?._id || product.brand)));
    const storefrontBrands = brands.filter(brand => storefrontBrandIds.has(String(brand._id)));
    const sparePartCategories = new Set(products.flatMap(product => product.categories || []));
    const storefrontCategories = spareParts.length > 0
      ? categories.filter(category => sparePartCategories.has(category.name))
      : categories;

    const modelsByMake = {};
    for (const product of allProducts) {
      for (const fitment of product.fitments || []) {
        if (!fitment.make || !fitment.model || !fitment.year) continue;
        modelsByMake[fitment.make] ||= {};
        modelsByMake[fitment.make][fitment.model] ||= new Set();
        modelsByMake[fitment.make][fitment.model].add(fitment.year);
      }
    }

    const sortedModelsByMake = Object.fromEntries(
      Object.entries(modelsByMake)
        .sort(([makeA], [makeB]) => makeA.localeCompare(makeB))
        .map(([make, models]) => [
          make,
          Object.fromEntries(
            Object.entries(models)
              .sort(([modelA], [modelB]) => modelA.localeCompare(modelB))
              .map(([model, years]) => [model, [...years].sort()])
          )
        ])
    );

    return JSON.parse(JSON.stringify({
      banners: activeBanners,
      categories: storefrontCategories,
      featuredCategories: categories.some(category => category.isFeatured)
        ? categories.filter(category => category.isFeatured)
        : categories,
      products: products.map(product => ({
        _id: product._id,
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        offerPrice: product.offerPrice,
        stock: product.stock,
        images: product.images?.slice(0, 1) || [],
        brand: product.brand ? { _id: product.brand._id, name: product.brand.name } : product.brand,
        categories: product.categories,
        fitments: product.fitments?.map(({ make, model, year, stock, isDemo }) => ({ make, model, year, stock, isDemo })) || [],
        isDemoData: product.isDemoData,
        hasInquiry: product.hasInquiry,
        whatsappNumber: product.whatsappNumber,
        customTags: product.customTags?.map(({ label, bgColor }) => ({ label, bgColor })) || [],
        attributes: product.attributes?.map(({ key, type, options }) => ({
          key,
          type,
          options: options?.map(({ label, stock, variationImages }) => ({
            label,
            stock,
            variationImages: variationImages?.slice(0, 1) || []
          })) || []
        })) || []
      })),
      brands: storefrontBrands,
      reviews,
      categorySortMode: settings?.categorySortMode || 'recent',
      fitmentMakes: Object.keys(sortedModelsByMake),
      modelsByMake: sortedModelsByMake
    }));
  },
  ['homepage-catalog'],
  { revalidate: 3600 }
);
