import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';
import { getStoreHighlightEmbed, validateStoreHighlight } from '@/lib/storeHighlightUrls';
import { resolveStoreHighlightCover, STORE_HIGHLIGHT_COVER_WARNING } from '@/lib/storeHighlightCover';
import { sortStoreHighlights } from '@/lib/storeHighlightOrder';
import StoreHighlight from '@/models/StoreHighlight';

export async function GET(request) {
  try {
    const includeInactive = new URL(request.url).searchParams.get('includeInactive') === 'true';
    let filter = { isActive: true };
    if (includeInactive) {
      const admin = await getAdmin(request);
      if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
      filter = {};
    }

    await dbConnect();
    const highlights = sortStoreHighlights(await StoreHighlight.find(filter).lean());
    const data = highlights.map(highlight => {
      const url = highlight.sourceUrl || highlight.url;
      return {
        ...highlight,
        url,
        ...getStoreHighlightEmbed(url)
      };
    });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching store highlights:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not load store highlights.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    const validated = validateStoreHighlight(await request.json());
    if (validated.error) return NextResponse.json({ success: false, error: validated.error }, { status: 400 });

    const thumbnailUrl = validated.data.coverImage
      ? ''
      : await resolveStoreHighlightCover(validated.data.sourceUrl);
    await dbConnect();
    const highlight = await StoreHighlight.create({
      ...validated.data,
      thumbnailUrl,
      thumbnailCheckedAt: validated.data.coverImage ? null : new Date()
    });
    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: 'created',
      entityType: 'StoreHighlight',
      entityId: highlight._id,
      description: `${admin.name} added store highlight ${highlight.title}.`
    });
    const data = highlight.toObject();
    return NextResponse.json({
      success: true,
      data: { ...data, url: data.sourceUrl || data.url, ...validated.embed },
      coverWarning: !data.coverImage && !data.thumbnailUrl ? STORE_HIGHLIGHT_COVER_WARNING : ''
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating store highlight:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not create store highlight.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? [...new Set(body.ids)] : [];
    if (
      ids.length === 0 ||
      ids.length > 500 ||
      ids.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))
    ) {
      return NextResponse.json({ success: false, error: 'Select between 1 and 500 valid highlights to delete.' }, { status: 400 });
    }

    await dbConnect();
    const result = await StoreHighlight.deleteMany({ _id: { $in: ids } });
    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: 'bulk_deleted',
      entityType: 'StoreHighlight',
      entityId: ids.join(','),
      description: `${admin.name} deleted ${result.deletedCount} store highlights.`
    });
    return NextResponse.json({ success: true, data: { deletedCount: result.deletedCount } }, { status: 200 });
  } catch (error) {
    console.error('Error bulk deleting store highlights:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not delete selected store highlights.' }, { status: 500 });
  }
}