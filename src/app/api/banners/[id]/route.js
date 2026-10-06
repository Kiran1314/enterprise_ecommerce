import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Banner from '@/models/Banner';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const banner = await Banner.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated', entityType: 'Banner', entityId: banner._id, description: `${admin.name} updated banner ${banner.title}.` });
    return NextResponse.json({ success: true, data: banner }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { id } = await params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'deleted', entityType: 'Banner', entityId: banner._id, description: `${admin.name} deleted banner ${banner.title}.` });
    return NextResponse.json({ success: true, message: 'Banner deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}