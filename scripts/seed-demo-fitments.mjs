import mongoose from 'mongoose';
import dbConnect from '../src/lib/dbConnect.js';
import Brand from '../src/models/Brand.js';
import Settings from '../src/models/Settings.js';
import Product from '../src/models/Product.js';

const shouldApply = process.argv.includes('--apply');
const sampleProducts = [
  { sku: 'SJ-DEMO-TOYOTA-COROLLA-2020', title: 'DEMO: Brake Pad Set', make: 'Toyota', model: 'Corolla', year: '2020' },
  { sku: 'SJ-DEMO-TOYOTA-LAND-CRUISER-2022', title: 'DEMO: Oil Filter', make: 'Toyota', model: 'Land Cruiser', year: '2022' },
  { sku: 'SJ-DEMO-NISSAN-PATROL-2021', title: 'DEMO: Air Filter', make: 'Nissan', model: 'Patrol', year: '2021' },
  { sku: 'SJ-DEMO-HONDA-CIVIC-2019', title: 'DEMO: Front Suspension Link', make: 'Honda', model: 'Civic', year: '2019' }
];

async function main() {
  console.log(`${shouldApply ? 'APPLY' : 'DRY RUN'}: demo vehicle fitments`);
  console.log(`Demo products to ${shouldApply ? 'upsert' : 'upsert'}: ${sampleProducts.length}`);
  sampleProducts.forEach(product => console.log(`${product.sku}: ${product.make} ${product.model} ${product.year}`));

  if (!shouldApply) {
    console.log('No database changes made. Run with --apply to add demo products.');
    return;
  }

  await dbConnect();
  const brand = await Brand.findOne({ slug: 'super-japan' }).select('_id').lean();
  if (!brand) throw new Error('Super Japan brand was not found; import the spare parts catalog first.');
  const settings = await Settings.findOne().select('companyPhone').lean();

  for (const product of sampleProducts) {
    const slug = product.sku.toLowerCase();
    await Product.updateOne(
      { sku: product.sku },
      {
        $set: {
          title: product.title,
          slug,
          description: `Demo catalog record for testing the vehicle selector. This is not a real product or verified compatibility claim.`,
          price: 0,
          stock: 0,
          images: ['/auto-parts.svg'],
          brand: brand._id,
          categories: ['Demo Fitments'],
          fitments: [{ make: product.make, model: product.model, year: product.year, isDemo: true }],
          isDemoData: true,
          isFeatured: false,
          hasInquiry: true,
          whatsappNumber: settings?.companyPhone || '',
          attributes: [],
          customTags: [{ label: 'DEMO DATA', bgColor: '#292d3d' }],
          highlights: []
        },
        $setOnInsert: { sku: product.sku }
      },
      { upsert: true, runValidators: true }
    );
  }

  console.log(`Demo products upserted: ${sampleProducts.length}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (shouldApply) await mongoose.disconnect();
  });