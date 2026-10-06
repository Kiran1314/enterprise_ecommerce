import mongoose from 'mongoose';
import XLSX from 'xlsx';
import dbConnect from '../src/lib/dbConnect.js';
import Brand from '../src/models/Brand.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Settings from '../src/models/Settings.js';

const workbookPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) || 'Sparer Parts List.xls';
const shouldApply = process.argv.includes('--apply');
const slugify = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function readCatalog(path) {
  const workbook = XLSX.readFile(path);
  const categorySheet = workbook.Sheets.Categories;
  const partsSheet = workbook.Sheets['Spare Parts Serial Wise'];

  if (!categorySheet || !partsSheet) {
    throw new Error('Workbook must contain "Categories" and "Spare Parts Serial Wise" sheets.');
  }

  const categoryRows = XLSX.utils.sheet_to_json(categorySheet, { header: 1, defval: '' });
  const categories = categoryRows.slice(2)
    .filter(row => Number.isInteger(Number(row[0])) && String(row[1]).trim())
    .map(row => ({ number: Number(row[0]), name: String(row[1]).trim() }));
  const categoriesByNumber = new Map(categories.map(category => [category.number, category]));
  const partRows = XLSX.utils.sheet_to_json(partsSheet, { header: 1, defval: '' });
  const products = [];
  let activeCategory = null;
  let nextSerial = 0;

  for (const row of partRows) {
    const categoryNumber = Number(row[0]);
    const sectionName = typeof row[2] === 'string' ? row[2].trim() : '';
    if (sectionName && categoriesByNumber.has(categoryNumber)) {
      activeCategory = categoriesByNumber.get(categoryNumber);
      nextSerial = 0;
      continue;
    }

    const title = typeof row[2] === 'string' ? row[2].trim() : '';
    if (activeCategory && title) {
      const hasSerial = row[1] !== '' && Number.isInteger(Number(row[1])) && Number(row[1]) > 0;
      const serial = hasSerial ? Number(row[1]) : nextSerial + 1;
      nextSerial = Math.max(nextSerial, serial);
      products.push({ category: activeCategory, serial, title });
    }
  }

  if (categories.length === 0 || products.length === 0) {
    throw new Error('No categories or parts were found in the expected workbook columns.');
  }

  return { categories, products };
}

async function main() {
  const { categories, products } = readCatalog(workbookPath);
  const productsByCategory = new Map();
  for (const product of products) {
    productsByCategory.set(product.category.number, (productsByCategory.get(product.category.number) || 0) + 1);
  }

  console.log(`${shouldApply ? 'APPLY' : 'DRY RUN'}: ${workbookPath}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Parts: ${products.length}`);
  console.log(`Categories without parts: ${categories.filter(category => !productsByCategory.has(category.number)).length}`);
  console.log('Workbook does not provide prices, stock quantities, brand names, or model years; imported parts will be quote-only without fitments.');

  if (!shouldApply) {
    console.log('No database changes made. Run with --apply to upsert this catalog.');
    return;
  }

  await dbConnect();
  const settings = await Settings.findOne().lean();
  const phone = settings?.companyPhone || '';
  await Settings.updateOne({ companyName: 'EnterpriseStore' }, { $set: { companyName: 'Super Japan' } });
  const brandSlug = 'super-japan';
  await Brand.updateOne(
    { slug: brandSlug },
    { $set: { name: 'Super Japan', logo: '/assets/images/logo/logo.jpg', description: 'Premium quality automotive spare parts.' }, $setOnInsert: { slug: brandSlug, isFeatured: true } },
    { upsert: true }
  );
  const brand = await Brand.findOne({ slug: brandSlug }).select('_id').lean();

  await Category.bulkWrite(categories.map(category => {
    const slug = slugify(category.name);
    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            name: category.name,
            slug,
            icon: '/auto-parts.svg',
            description: `Automotive spare parts: ${category.name.toLowerCase()}.`
          }
        },
        upsert: true
      }
    };
  }), { ordered: false });

  const results = await Product.bulkWrite(products.map(product => {
    const categoryCode = String(product.category.number).padStart(2, '0');
    const serialCode = String(product.serial).padStart(3, '0');
    const sku = `SJ-${categoryCode}-${serialCode}`;
    const slug = `${slugify(product.title)}-${sku.toLowerCase()}`;
    return {
      updateOne: {
        filter: { sku },
        update: {
          $set: {
            title: product.title,
            slug,
            description: `${product.title} from the ${product.category.name} range. Contact us to confirm fitment, availability, and pricing.`,
            brand: brand._id,
            categories: [product.category.name],
            hasInquiry: true,
            whatsappNumber: phone
          },
          $setOnInsert: {
            sku,
            price: 0,
            stock: 0,
            images: ['/auto-parts.svg'],
            fitments: [],
            isFeatured: false,
            attributes: [],
            customTags: [],
            highlights: []
          }
        },
        upsert: true
      }
    };
  }), { ordered: false });

  await Product.updateMany(
    { sku: /^SJ-\d{2}-\d{3}$/, $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] },
    { $set: { images: ['/auto-parts.svg'] } }
  );

  console.log(`Categories upserted: ${categories.length}`);
  console.log(`Parts inserted: ${results.upsertedCount}`);
  console.log(`Parts updated: ${results.modifiedCount}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.argv.includes('--apply')) await mongoose.disconnect();
  });