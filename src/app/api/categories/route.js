import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/Category';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const body = await request.json();
    
    if (body.attributes && Array.isArray(body.attributes)) {
      body.attributes = body.attributes.map(attr => ({
        name: typeof attr === 'object' ? attr.name : attr,
        type: typeof attr === 'object' ? (attr.type || 'select') : 'select'
      }));
    }

    const category = await Category.create(body);
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'created', entityType: 'Category', entityId: category._id, description: `${admin.name} added category ${category.name}.` });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}