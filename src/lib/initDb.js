import dbConnect from './dbConnect';
import Admin from '../models/Admin';
import Brand from '../models/Brand';
import Product from '../models/Product';
import Banner from '../models/Banner';
import GoogleReview from '../models/GoogleReview';

export async function initializeDatabase() {
  await dbConnect();

  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    await Admin.create({
      name: 'Super Administrator',
      email: 'admin@enterprise.com',
      password: 'securePassword123',
      role: 'SuperAdmin',
      isActive: true
    });
    console.log('Seeded default Super Admin.');
  }

  const brandCount = await Brand.countDocuments();
  let sampleBrand;
  if (brandCount === 0) {
    sampleBrand = await Brand.create({
      name: 'TechCorp',
      slug: 'techcorp',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9',
      description: 'Leading innovator in hardware technology.',
      isFeatured: true
    });
    console.log('Seeded default Brand.');
  } else {
    sampleBrand = await Brand.findOne();
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0 && sampleBrand) {
    await Product.create({
      title: 'Enterprise UltraBook Pro',
      slug: 'enterprise-ultrabook-pro',
      sku: 'ENT-UB-001',
      description: 'High performance laptop for developers and enterprise solutions architects.',
      price: 1499.99,
      comparePrice: 1799.99,
      stock: 150,
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'],
      brand: sampleBrand._id,
      categories: ['Laptops', 'Computers'],
      isFeatured: true,
      isSpecialPromotion: true,
      seo: {
        metaTitle: 'Enterprise UltraBook Pro - High Performance',
        metaDescription: 'Shop the high-performance Enterprise UltraBook Pro designed for engineering professionals.',
        keywords: ['laptop', 'ultrabook', 'enterprise']
      },
      whatsappNumber: '+1234567890'
    });
    console.log('Seeded default Product.');
  }

  const bannerCount = await Banner.countDocuments();
  if (bannerCount === 0) {
    await Banner.create({
      title: 'Next-Gen Enterprise Solutions',
      subtitle: 'Build robust applications with unmatched reliability',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',
      link: '/shop',
      order: 1,
      isActive: true
    });
    console.log('Seeded default Banner.');
  }

  const reviewCount = await GoogleReview.countDocuments();
  if (reviewCount === 0) {
    await GoogleReview.create({
      authorName: 'Sarah Jenkins',
      rating: 5,
      reviewText: 'Outstanding platform stability and super quick lightning checkout experience!',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      isDemo: true,
      isDisplayed: true
    });
    console.log('Seeded default Google Review.');
  }
}