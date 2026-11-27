import { getStoreHighlightEmbed } from '@/lib/storeHighlightUrls';

const MAX_RESPONSE_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 3000;
const COVER_RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const STORE_HIGHLIGHT_COVER_WARNING = 'No public video cover was found. Check that the post is public or add a cover image URL.';

function isProviderHost(hostname, platform) {
  const host = hostname.toLowerCase().replace(/^(www|m)\./, '');
  if (platform === 'Instagram') return host === 'instagram.com' || host.endsWith('.instagram.com');
  if (platform === 'Facebook') return host === 'facebook.com' || host.endsWith('.facebook.com');
  return host === 'tiktok.com' || host.endsWith('.tiktok.com');
}

function isAllowedImageHost(hostname) {
  const host = hostname.toLowerCase();
  return [
    'instagram.com',
    'cdninstagram.com',
    'fbcdn.net',
    'fbsbx.com',
    'tiktok.com',
    'tiktokcdn.com',
    'tiktokcdn-us.com',
    'tiktokcdn-eu.com',
    'byteoversea.com',
    'ibytedtos.com'
  ].some(domain => host === domain || host.endsWith(`.${domain}`));
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function getMetaImage(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attributes = {};
    const attributePattern = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let match;
    while ((match = attributePattern.exec(tag))) {
      attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '');
    }

    const property = (attributes.property || attributes.name || attributes.itemprop || '').toLowerCase();
    if (['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image'].includes(property)) {
      const image = attributes.content;
      if (image) return image;
    }
  }
  return '';
}

async function readResponseText(response) {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_RESPONSE_BYTES || !response.body) return '';

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      return '';
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function normalizeImageUrl(value) {
  try {
    const imageUrl = new URL(value);
    if (
      imageUrl.protocol !== 'https:' ||
      imageUrl.username ||
      imageUrl.password ||
      !isAllowedImageHost(imageUrl.hostname)
    ) return '';
    return imageUrl.toString();
  } catch {
    return '';
  }
}

async function fetchProviderPage(sourceUrl, platform) {
  let target = new URL(sourceUrl);
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
    const response = await fetch(target, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; StoreHighlights/1.0; +https://www.superrfjapan.com)'
      },
      redirect: 'manual',
      signal
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirectCount === 3) return null;
      target = new URL(location, target);
      if (
        target.protocol !== 'https:' ||
        target.username ||
        target.password ||
        !isProviderHost(target.hostname, platform)
      ) return null;
      await response.body?.cancel();
      continue;
    }

    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) return null;
    return response;
  }
  return null;
}

async function fetchTikTokCover(sourceUrl) {
  const endpoint = new URL('https://www.tiktok.com/oembed');
  endpoint.searchParams.set('url', sourceUrl);
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; StoreHighlights/1.0; +https://www.superrfjapan.com)'
    },
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('application/json')) return '';
  const body = await readResponseText(response);
  if (!body) return '';
  return normalizeImageUrl(JSON.parse(body).thumbnail_url);
}

export async function resolveStoreHighlightCover(sourceUrl) {
  const { platform } = getStoreHighlightEmbed(sourceUrl);
  try {
    if (platform === 'TikTok') return await fetchTikTokCover(sourceUrl);

    const response = await fetchProviderPage(sourceUrl, platform);
    if (!response) return '';
    const html = await readResponseText(response);
    return html ? normalizeImageUrl(getMetaImage(html)) : '';
  } catch (error) {
    console.warn(`Unable to retrieve ${platform} Store Highlight cover:`, error.message);
    return '';
  }
}

export function shouldRefreshStoreHighlightCover(highlight, now = Date.now()) {
  if (highlight.coverImage || highlight.thumbnailUrl) return false;
  if (!highlight.thumbnailCheckedAt) return true;
  return now - new Date(highlight.thumbnailCheckedAt).getTime() >= COVER_RETRY_INTERVAL_MS;
}
