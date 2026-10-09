import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/Product';

export async function POST(req) {
  try {
    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, error: 'No product records provided.' }, { status: 400 });
    }

    // Ensure DB connection is active
    if (mongoose.connection.readyState === 0 && process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Upsert by SKU so existing products are updated and new ones are inserted
    const bulkOps = products.map(prod => ({
      updateOne: {
        filter: { sku: prod.sku },
        update: { $set: prod },
        upsert: true
      }
    }));

    const result = await Product.bulkWrite(bulkOps);
    const totalProcessed = (result.upsertedCount || 0) + (result.modifiedCount || 0);

    return NextResponse.json({
      success: true,
      count: totalProcessed || products.length,
      message: 'Bulk import completed successfully.'
    });
  } catch (error) {
    console.error('Bulk CSV Import Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Bulk import failed.' }, { status: 500 });
  }
}