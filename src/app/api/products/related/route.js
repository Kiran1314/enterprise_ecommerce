import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categories = [...new Set(searchParams.getAll('category').map(value => value.trim()).filter(Boolean))];
    const slug = searchParams.get('slug')?.trim();
    const make = searchParams.get('make')?.trim();
    const model = searchParams.get('model')?.trim();
    const year = searchParams.get('year')?.trim();
    const hasAnyFitmentFilter = Boolean(make || model || year);

    if (categories.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }
    if (hasAnyFitmentFilter && (!make || !model || !year)) {
      return NextResponse.json({ success: false, error: 'Make, model, and year must be provided together.' }, { status: 400 });
    }

    await dbConnect();

    const stockFilter = hasAnyFitmentFilter
      ? { fitments: { $elemMatch: { make, model, year, stock: { $gt: 0 } } } }
      : {
        $or: [
          { fitments: { $elemMatch: { stock: { $gt: 0 } } } },
          {
            $and: [
              { $or: [{ fitments: { $exists: false } }, { fitments: { $size: 0 } }] },
              { stock: { $gt: 0 } }
            ]
          }
        ]
      };

    const filter = {
      categories: { $in: categories },
      isDemoData: { $ne: true },
      ...stockFilter
    };
    if (slug) filter.slug = { $ne: slug };

    const products = await Product.find(filter)
      .select('title slug price offerPrice comparePrice stock fitments images brand categories attributes hasInquiry whatsappNumber customTags')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching related products:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}