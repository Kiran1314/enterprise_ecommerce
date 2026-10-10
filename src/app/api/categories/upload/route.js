import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('icon'); // Matches frontend 'icon'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file received.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define path and ensure directory exists
    const uploadDir = path.join(process.cwd(), 'public/assets/images/spare-parts');
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Sanitize original filename spaces/special characters
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); 
    const filename = `${uniqueSuffix}-${safeFilename}`;
    const filepath = path.join(uploadDir, filename);

    // Save physical file
    await writeFile(filepath, buffer);

    // Return the relative URL for frontend mapping
    const publicPath = `/assets/images/spare-parts/${filename}`;

    return NextResponse.json({ success: true, icon: publicPath });
  } catch (error) {
    console.error('Category Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload category icon' }, { status: 500 });
  }
}