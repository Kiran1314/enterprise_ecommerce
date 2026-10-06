import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Brand from '@/models/Brand';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: brand }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const brand = await Brand.findByIdAndUpdate(id, body, { new: true, runValidators: true, returnDocument: 'after' });
    if (!brand) {
      return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated', entityType: 'Brand', entityId: brand._id, description: `${admin.name} updated brand ${brand.name}.` });
    return NextResponse.json({ success: true, data: brand }, { status: 200 });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { id } = await params;
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'deleted', entityType: 'Brand', entityId: brand._id, description: `${admin.name} deleted brand ${brand.name}.` });
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}