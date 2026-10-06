import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Banner from '@/models/Banner';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function GET() {
  try {
    await dbConnect();
    const banners = await Banner.find({}).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: banners }, { status: 200 });
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
    const banner = await Banner.create(body);
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'created', entityType: 'Banner', entityId: banner._id, description: `${admin.name} added banner ${banner.title}.` });
    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}