import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
const MAX_SIZE = 8 * 1024 * 1024;
const MAX_FILES = 12;

function imageExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return 'gif';
  return null;
}

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const formData = await request.formData();
    const files = [...formData.getAll('images'), ...formData.getAll('icon')]
      .filter(file => file && typeof file !== 'string');
    if (!files.length) return NextResponse.json({ success: false, error: 'Choose one or more images.' }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ success: false, error: `Upload up to ${MAX_FILES} images at a time.` }, { status: 400 });

    const uploadDir = path.join(process.cwd(), 'public', 'assets', 'images', 'spare-parts');
    await mkdir(uploadDir, { recursive: true });
    const images = [];
    for (const file of files) {
      if (!file.size || file.size > MAX_SIZE) return NextResponse.json({ success: false, error: `${file.name}: image must be between 1 byte and 8 MB.` }, { status: 413 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = imageExtension(buffer);
      if (!ext) return NextResponse.json({ success: false, error: `${file.name}: use JPG, PNG, WebP, or GIF.` }, { status: 415 });
      const filename = `${randomUUID()}.${ext}`;
      await writeFile(path.join(uploadDir, filename), buffer, { flag: 'wx' });
      images.push(`/assets/images/spare-parts/${filename}`);
    }
    return NextResponse.json({ success: true, images, icon: images[0] }, { status: 201 });
  } catch (error) {
    console.error('Category image upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to upload images.' }, { status: 500 });
  }
}
