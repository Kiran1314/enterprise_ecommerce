import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Brand from '@/models/Brand';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function GET() {
  try {
    await dbConnect();
    const brands = await Brand.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: brands }, { status: 200 });
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
    const brand = await Brand.create(body);
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'created', entityType: 'Brand', entityId: brand._id, description: `${admin.name} added brand ${brand.name}.` });
    return NextResponse.json({ success: true, data: brand }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}