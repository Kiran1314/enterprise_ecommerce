import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function PATCH(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { oldLabel, label, bgColor } = await request.json();
    const previousLabel = String(oldLabel || '').trim();
    const updatedLabel = String(label || '').trim();
    if (!previousLabel || !updatedLabel || !/^#[\da-f]{6}$/i.test(bgColor || '')) {
      return NextResponse.json({ success: false, error: 'A tag label and valid color are required.' }, { status: 400 });
    }
    if (previousLabel !== updatedLabel && await Product.exists({
      customTags: { $elemMatch: { label: updatedLabel } }
    })) {
      return NextResponse.json({ success: false, error: 'A tag with this label already exists.' }, { status: 409 });
    }

    const result = await Product.updateMany(
      { customTags: { $elemMatch: { label: previousLabel } } },
      {
        $set: {
          'customTags.$[tag].label': updatedLabel,
          'customTags.$[tag].bgColor': bgColor
        }
      },
      { arrayFilters: [{ 'tag.label': previousLabel }] }
    );
    if (!result.matchedCount) {
      return NextResponse.json({ success: false, error: 'Saved tag not found.' }, { status: 404 });
    }

    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: 'updated',
      entityType: 'CustomTag',
      entityId: previousLabel,
      description: `${admin.name} updated custom tag "${previousLabel}" to "${updatedLabel}" on ${result.modifiedCount} products.`
    });
    return NextResponse.json({ success: true, data: { updatedProducts: result.modifiedCount } }, { status: 200 });
  } catch (error) {
    console.error('Error updating custom tag:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { label } = await request.json();
    const tagLabel = String(label || '').trim();
    if (!tagLabel) {
      return NextResponse.json({ success: false, error: 'A tag label is required.' }, { status: 400 });
    }

    const result = await Product.updateMany(
      { customTags: { $elemMatch: { label: tagLabel } } },
      { $pull: { customTags: { label: tagLabel } } }
    );
    if (!result.matchedCount) {
      return NextResponse.json({ success: false, error: 'Saved tag not found.' }, { status: 404 });
    }

    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: 'deleted',
      entityType: 'CustomTag',
      entityId: tagLabel,
      description: `${admin.name} deleted custom tag "${tagLabel}" from ${result.modifiedCount} products.`
    });
    return NextResponse.json({ success: true, data: { updatedProducts: result.modifiedCount } }, { status: 200 });
  } catch (error) {
    console.error('Error deleting custom tag:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
