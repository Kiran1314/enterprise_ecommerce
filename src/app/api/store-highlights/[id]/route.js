import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';
import { getStoreHighlightEmbed, validateStoreHighlight } from '@/lib/storeHighlightUrls';
import { resolveStoreHighlightCover, STORE_HIGHLIGHT_COVER_WARNING } from '@/lib/storeHighlightCover';
import StoreHighlight from '@/models/StoreHighlight';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    const validated = validateStoreHighlight(await request.json());
    if (validated.error) return NextResponse.json({ success: false, error: validated.error }, { status: 400 });

    await dbConnect();
    const { id } = await params;
    const existing = await StoreHighlight.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Store highlight not found.' }, { status: 404 });

    const sourceChanged = (existing.sourceUrl || existing.url) !== validated.data.sourceUrl;
    let thumbnailUrl = existing.thumbnailUrl || '';
    let thumbnailCheckedAt = existing.thumbnailCheckedAt || null;
    if (sourceChanged) {
      thumbnailUrl = validated.data.coverImage ? '' : await resolveStoreHighlightCover(validated.data.sourceUrl);
      thumbnailCheckedAt = validated.data.coverImage ? null : new Date();
    } else if (!validated.data.coverImage && !thumbnailUrl) {
      thumbnailUrl = await resolveStoreHighlightCover(validated.data.sourceUrl);
      thumbnailCheckedAt = new Date();
    }

    const highlight = await StoreHighlight.findByIdAndUpdate(
      id,
      { ...validated.data, thumbnailUrl, thumbnailCheckedAt },
      { new: true, runValidators: true }
    );

    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: 'updated',
      entityType: 'StoreHighlight',
      entityId: highlight._id,
      description: `${admin.name} updated store highlight ${highlight.title}.`
    });
    const data = highlight.toObject();
    return NextResponse.json({
      success: true,
      data: { ...data, url: data.sourceUrl || data.url, ...validated.embed },
      coverWarning: !data.coverImage && !data.thumbnailUrl ? STORE_HIGHLIGHT_COVER_WARNING : ''
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating store highlight:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not update store highlight.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const body = await request.json();
    if (typeof body?.isPinned !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Pinned status must be true or false.' }, { status: 400 });
    }

    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid store highlight ID.' }, { status: 400 });
    }

    await dbConnect();
    const highlight = await StoreHighlight.findByIdAndUpdate(
      id,
      { isPinned: body.isPinned },
      { new: true, runValidators: true }
    );
    if (!highlight) return NextResponse.json({ success: false, error: 'Store highlight not found.' }, { status: 404 });

    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: body.isPinned ? 'pinned' : 'unpinned',
      entityType: 'StoreHighlight',
      entityId: highlight._id,
      description: `${admin.name} ${body.isPinned ? 'pinned' : 'unpinned'} store highlight ${highlight.title}.`
    });

    const url = highlight.sourceUrl || highlight.url;
    return NextResponse.json({
      success: true,
      data: { ...highlight.toObject(), url, ...getStoreHighlightEmbed(url) }
    }, { status: 200 });
  } catch (error) {
    console.error('Error pinning store highlight:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not change store highlight pin.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const highlight = await StoreHighlight.findByIdAndDelete(id);
    if (!highlight) return NextResponse.json({ success: false, error: 'Store highlight not found.' }, { status: 404 });

    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: 'deleted',
      entityType: 'StoreHighlight',
      entityId: highlight._id,
      description: `${admin.name} deleted store highlight ${highlight.title}.`
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting store highlight:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not delete store highlight.' }, { status: 500 });
  }
}