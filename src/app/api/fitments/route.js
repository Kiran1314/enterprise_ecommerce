import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import Brand from '@/models/Brand';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const make = searchParams.get('make')?.trim();
    const model = searchParams.get('model')?.trim();
    const year = searchParams.get('year')?.trim();
    const brandSlug = searchParams.get('brand')?.trim();
    let brandFilter = {};
    if (brandSlug) {
      const brand = await Brand.findOne({ slug: brandSlug }).select('_id').lean();
      if (!brand) return NextResponse.json({ success: true, data: [] });
      brandFilter = { brand: brand._id };
    }

    if (!make) {
      const makes = await Product.distinct('fitments.make', { ...brandFilter, 'fitments.0': { $exists: true } });
      return NextResponse.json({ success: true, data: makes.filter(Boolean).sort() });
    }

    if (!model) {
      const models = await Product.aggregate([
        { $match: brandFilter },
        { $unwind: '$fitments' },
        { $match: { 'fitments.make': make } },
        { $group: { _id: '$fitments.model' } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, value: '$_id' } }
      ]);
      return NextResponse.json({ success: true, data: models.map(option => option.value).filter(Boolean) });
    }

    if (!year) {
      const years = await Product.aggregate([
        { $match: brandFilter },
        { $unwind: '$fitments' },
        { $match: { 'fitments.make': make, 'fitments.model': model } },
        { $group: { _id: '$fitments.year' } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, value: '$_id' } }
      ]);
      return NextResponse.json({ success: true, data: years.map(option => option.value).filter(Boolean) });
    }

    const products = await Product.find({ ...brandFilter, fitments: { $elemMatch: { make, model, year } } })
      .populate('brand')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Error searching vehicle fitments:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}