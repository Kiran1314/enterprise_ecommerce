import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/adminAuth';
import { deleteSecondaryImages, prepareImageFile, uploadSecondaryImage } from '@/lib/secondaryImageStorage';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('image');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Choose a brand image to upload.' }, { status: 400 });
    }

    const image = await prepareImageFile(file);
    const logo = await uploadSecondaryImage(image, 'brands');
    return NextResponse.json({ success: true, logo }, { status: 201 });
  } catch (error) {
    console.error('Brand image upload failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Brand image upload failed.' }, { status: error.status || 500 });
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

    await deleteSecondaryImages(imageUrls, 'brands');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Brand image deletion failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Brand image deletion failed.' }, { status: 500 });
  }
}