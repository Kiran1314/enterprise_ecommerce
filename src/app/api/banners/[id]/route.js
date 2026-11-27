import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Banner from '@/models/Banner';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';
import { deleteSecondaryImages } from '@/lib/secondaryImageStorage';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const existing = await Banner.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    const banner = await Banner.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated', entityType: 'Banner', entityId: banner._id, description: `${admin.name} updated banner ${banner.title}.` });
    let warning = '';
    if (existing.image !== banner.image) {
      try {
        await deleteSecondaryImages([existing.image], 'banners');
      } catch (cleanupError) {
        console.error('Old banner image cleanup failed:', cleanupError);
        warning = 'Banner saved, but its previous secondary-storage image could not be deleted.';
      }
    }
    return NextResponse.json({ success: true, data: banner, warning }, { status: 200 });
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
    let warning = '';
    try {
      await deleteSecondaryImages([banner.image], 'banners');
    } catch (cleanupError) {
      console.error('Banner image cleanup failed:', cleanupError);
      warning = 'Banner deleted, but its secondary-storage image could not be deleted.';
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'deleted', entityType: 'Banner', entityId: banner._id, description: `${admin.name} deleted banner ${banner.title}.` });
    return NextResponse.json({ success: true, message: 'Banner deleted successfully', warning }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}