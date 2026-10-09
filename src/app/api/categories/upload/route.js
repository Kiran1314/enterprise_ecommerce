import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('icon'); 

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file received.' }, { status: 400 });
    }

    // Sanitize filename
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); 
    const uniqueFilename = `categories/${Date.now()}-${safeFilename}`;

    // Upload directly to Vercel Blob storage
    const blob = await put(uniqueFilename, file, {
      access: 'public',
    });

    // Return the permanent public URL provided by Vercel Blob
    return NextResponse.json({ success: true, icon: blob.url });
  } catch (error) {
    console.error('Category Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload category icon' }, { status: 500 });
  }
}