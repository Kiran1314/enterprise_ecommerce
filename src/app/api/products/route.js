import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import Brand from '@/models/Brand'; // Required to populate Brand reference
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function GET(request) {
  try {
    await dbConnect();
    const search = new URL(request.url).searchParams.get('q')?.trim();
    const escapedSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = escapedSearch ? {
      $or: [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { sku: { $regex: escapedSearch, $options: 'i' } },
        { categories: { $regex: escapedSearch, $options: 'i' } }
      ]
    } : {};
    let productQuery = Product.find(filter)
      .populate('brand')
      .sort({ createdAt: -1 });
    if (search) productQuery = productQuery.limit(8);
    const products = await productQuery;
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const body = await request.json();
    const fitments = normalizeFitments(body.fitments);
    if (!fitments.valid) return NextResponse.json({ success: false, error: fitments.error }, { status: 400 });
    const product = await Product.create({ ...body, fitments: fitments.data });
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'created', entityType: 'Product', entityId: product._id, description: `${admin.name} added product ${product.title}.` });
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function normalizeFitments(fitments) {
  if (!Array.isArray(fitments)) return { valid: true, data: [] };
  const data = [];
  for (const fitment of fitments) {
    const make = String(fitment.make || '').trim();
    const model = String(fitment.model || '').trim();
    const year = String(fitment.year || '').trim();
    if (!make && !model && !year) continue;
    if (!make || !model || !year) return { valid: false, error: 'Each vehicle stock row must include Make, Model, and Model Year.' };
    const stock = Number(fitment.stock ?? 0);
    if (!Number.isInteger(stock) || stock < 0) return { valid: false, error: 'Vehicle stock must be a non-negative whole number.' };
    data.push({ make, model, year, stock, isDemo: Boolean(fitment.isDemo) });
  }
  return { valid: true, data };
}