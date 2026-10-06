import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

const maxFileSize = 8 * 1024 * 1024;
const imageTypes = [
  { extension: 'jpg', matches: bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { extension: 'png', matches: bytes => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { extension: 'webp', matches: bytes => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' },
  { extension: 'gif', matches: bytes => ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)) }
];

export async function POST(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > maxFileSize + 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Image must be 8 MB or smaller.' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('image');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Choose a brand image to upload.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > maxFileSize) {
      return NextResponse.json({ success: false, error: 'Image must be between 1 byte and 8 MB.' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const imageType = imageTypes.find(type => type.matches(bytes));
    if (!imageType) {
      return NextResponse.json({ success: false, error: 'Use a valid JPG, PNG, WebP, or GIF image.' }, { status: 415 });
    }

    const filename = `${randomUUID()}.${imageType.extension}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'assets', 'images', 'brands');
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), bytes, { flag: 'wx' });

    return NextResponse.json({ success: true, logo: `/assets/images/brands/${filename}` }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Brand image upload failed.' }, { status: 500 });
  }
}