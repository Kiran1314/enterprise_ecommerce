import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/adminAuth';
import { deleteSecondaryImages, prepareImageFile, uploadSecondaryImage } from '@/lib/secondaryImageStorage';

export const runtime = 'nodejs';

const maxFileSize = 8 * 1024 * 1024;

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > maxFileSize + 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Image must be 8 MB or smaller.' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('image');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Choose an image to upload.' }, { status: 400 });
    }
    const image = await prepareImageFile(file, maxFileSize);
    const imageUrl = await uploadSecondaryImage(image, 'banners');

    return NextResponse.json({ success: true, image: imageUrl }, { status: 201 });
  } catch (error) {
    console.error('Banner image upload failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Image upload failed.' }, { status: error.status || 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const { imageUrls } = await request.json();
    if (!Array.isArray(imageUrls) || imageUrls.some(url => typeof url !== 'string')) {
      return NextResponse.json({ success: false, error: 'Provide an array of image URLs.' }, { status: 400 });
    }

    await deleteSecondaryImages(imageUrls, 'banners');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Banner image deletion failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Banner image deletion failed.' }, { status: 500 });
  }
}