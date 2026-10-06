import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import Brand from '@/models/Brand';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

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

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    
    // Find by slug first, or fallback to _id if it's a valid ObjectId
    let product = await Product.findOne({ slug }).populate('brand');
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).populate('brand');
    }
    
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { slug } = await params;
    const body = await request.json();
    const fitments = normalizeFitments(body.fitments);
    if (!fitments.valid) return NextResponse.json({ success: false, error: fitments.error }, { status: 400 });
    let previous = slug.match(/^[0-9a-fA-F]{24}$/) ? await Product.findById(slug) : null;
    if (!previous) previous = await Product.findOne({ slug });
    const product = previous;
    
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    Object.assign(product, { ...body });
    product.fitments = fitments.data;
    product.markModified('fitments');
    await product.save();
    const savedProduct = await Product.findById(product._id).lean();
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated', entityType: 'Product', entityId: product._id, description: `${admin.name} updated product ${product.title}.` });

    return NextResponse.json({ success: true, data: savedProduct }, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { slug } = await params;
    
    let product = await Product.findOneAndDelete({ slug });
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndDelete(slug);
    }

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'deleted', entityType: 'Product', entityId: product._id, description: `${admin.name} deleted product ${product.title}.` });

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}