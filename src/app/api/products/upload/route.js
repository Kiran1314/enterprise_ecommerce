import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/adminAuth';
import {
  deleteSecondaryImages,
  prepareImageFile,
  uploadSecondaryImage
} from '@/lib/secondaryImageStorage';

export const runtime = 'nodejs';
const MAX_FILES = 12;

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const formData = await request.formData();
    const files = [...formData.getAll('images'), ...formData.getAll('image')]
      .filter(file => file && typeof file !== 'string');
    if (!files.length) {
      return NextResponse.json({ success: false, error: 'Choose one or more images.' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ success: false, error: `Upload up to ${MAX_FILES} images at a time.` }, { status: 400 });
    }

    const preparedImages = [];
    for (const file of files) preparedImages.push(await prepareImageFile(file));

    const images = [];
    try {
      for (const image of preparedImages) {
        images.push(await uploadSecondaryImage(image, 'products'));
      }
    } catch (error) {
      try {
        await deleteSecondaryImages(images, 'products');
      } catch (cleanupError) {
        console.error('Failed to clean up partially uploaded product images:', cleanupError);
      }
      throw error;
    }

    return NextResponse.json({ success: true, images, imageUrl: images[0] }, { status: 201 });
  } catch (error) {
    console.error('Product Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to upload product images.' }, { status: error.status || 500 });
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

    await deleteSecondaryImages(imageUrls, 'products');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Product image deletion error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete product images.' }, { status: 500 });
  }
}