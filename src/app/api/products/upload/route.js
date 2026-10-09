import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('image'); 

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file received.' }, { status: 400 });
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); 
    const uniqueFilename = `products/${Date.now()}-${safeFilename}`;

    // Upload directly to Vercel Blob storage
    const blob = await put(uniqueFilename, file, {
      access: 'public',
    });

    // Return the permanent public URL provided by Vercel Blob
    return NextResponse.json({ success: true, imageUrl: blob.url });
  } catch (error) {
    console.error('Product Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload product image' }, { status: 500 });
  }
}