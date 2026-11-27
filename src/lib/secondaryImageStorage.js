import { del, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const STORAGE_GROUPS = new Set(['products', 'brands', 'categories', 'banners']);
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const IMAGE_TYPES = [
  {
    extension: 'jpg',
    contentType: 'image/jpeg',
    matches: buffer => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  },
  {
    extension: 'png',
    contentType: 'image/png',
    matches: buffer => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  },
  {
    extension: 'webp',
    contentType: 'image/webp',
    matches: buffer => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  },
  {
    extension: 'gif',
    contentType: 'image/gif',
    matches: buffer => ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))
  }
];

function imageError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getSecondaryBlobConfig() {
  const storeId = process.env.BLOB_SECONDARY_STORE_ID?.trim();
  const token = process.env.BLOB_SECONDARY_READ_WRITE_TOKEN?.trim();
  if (!storeId || !/^[A-Za-z0-9_-]+$/.test(storeId) || !token) {
    throw new Error('Secondary image storage is not configured.');
  }
  return { storeId, token };
}

function getStoragePath(group) {
  if (!STORAGE_GROUPS.has(group)) throw new Error('Unsupported secondary image storage group.');
  return `${group}-secondary`;
}

function isSecondaryBlobUrl(value, group) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname.endsWith('.public.blob.vercel-storage.com')
      && url.pathname.startsWith(`/${getStoragePath(group)}/`);
  } catch {
    return false;
  }
}

export async function prepareImageFile(file, maxFileSize = MAX_FILE_SIZE) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    throw imageError('Choose a valid image file.', 400);
  }
  if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
    throw imageError('Invalid image upload size limit.', 500);
  }
  if (!file.size || file.size > maxFileSize) {
    throw imageError(`${file.name}: image must be between 1 byte and ${maxFileSize / (1024 * 1024)} MB.`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageType = IMAGE_TYPES.find(type => type.matches(buffer));
  if (!imageType) {
    throw imageError(`${file.name}: use JPG, PNG, WebP, or GIF.`, 415);
  }
  return { buffer, ...imageType };
}

export async function uploadSecondaryImage(image, group) {
  const { storeId, token } = getSecondaryBlobConfig();
  const pathname = `${getStoragePath(group)}/${storeId}/${randomUUID()}.${image.extension}`;
  const result = await put(pathname, image.buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: image.contentType,
    token
  });
  return result.url;
}

export async function deleteSecondaryImages(values, group) {
  const storagePath = getStoragePath(group);
  const candidates = [...new Set((values || []).filter(value => isSecondaryBlobUrl(value, group)))];
  if (!candidates.length) return;

  const { storeId, token } = getSecondaryBlobConfig();
  const pathnamePrefix = `/${storagePath}/${storeId}/`;
  const ownedUrls = candidates.filter(value => new URL(value).pathname.startsWith(pathnamePrefix));
  if (ownedUrls.length) await del(ownedUrls, { token });
}

export function collectProductImageUrls(product) {
  const urls = Array.isArray(product?.images) ? [...product.images] : [];
  for (const attribute of product?.attributes || []) {
    for (const option of attribute.options || []) {
      if (option.image) urls.push(option.image);
      urls.push(...(option.variationImages || []));
    }
  }
  return [...new Set(urls.filter(url => typeof url === 'string' && url))];
}

export function collectCategoryImageUrls(category) {
  const urls = [...(category?.images || []), category?.icon];
  for (const subcategory of category?.subcategories || []) {
    urls.push(...(subcategory.images || []), subcategory.icon);
  }
  return [...new Set(urls.filter(url => typeof url === 'string' && url))];
}
