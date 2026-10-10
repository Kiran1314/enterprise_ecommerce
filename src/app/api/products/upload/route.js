import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('image'); // Matches frontend 'image'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file received.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public/assets/images/spare-parts');
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); 
    const filename = `${uniqueSuffix}-${safeFilename}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const publicPath = `/assets/images/spare-parts/${filename}`;

    return NextResponse.json({ success: true, imageUrl: publicPath });
  } catch (error) {
    console.error('Product Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload product image' }, { status: 500 });
  }
}