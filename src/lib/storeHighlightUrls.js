function normalizeHost(hostname) {
  return hostname.toLowerCase().replace(/^(www|m)\./, '');
}

export function getStoreHighlightEmbed(urlValue) {
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error('Enter a valid public Facebook, Instagram, or TikTok reel URL.');
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Use an HTTPS link to a public Facebook, Instagram, or TikTok reel.');
  }

  const host = normalizeHost(url.hostname);
  if (host === 'instagram.com') {
    const match = url.pathname.match(/^\/(reel|p)\/([A-Za-z0-9_-]+)\/?$/i);
    if (!match) throw new Error('Use a direct Instagram Reel or post URL.');
    const [, type, shortcode] = match;
    return {
      platform: 'Instagram',
      embedUrl: `https://www.instagram.com/${type.toLowerCase()}/${shortcode}/embed/`
    };
  }

  if (host === 'facebook.com') {
    const isReel = /^\/reel\/[^/]+\/?$/i.test(url.pathname);
    const isVideo = /\/videos\/[^/]+\/?$/i.test(url.pathname);
    const hasWatchId = /^\/watch\/?$/i.test(url.pathname) && Boolean(url.searchParams.get('v'));
    if (!isReel && !isVideo && !hasWatchId) {
      throw new Error('Use a direct Facebook Reel or video URL.');
    }
    return {
      platform: 'Facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false&autoplay=true&mute=false`
    };
  }

  if (host === 'tiktok.com') {
    const match = url.pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/i);
    if (!match) throw new Error('Use a full TikTok video URL, not a shortened link.');
    return {
      platform: 'TikTok',
      embedUrl: `https://www.tiktok.com/player/v1/${match[1]}?autoplay=1&controls=1&description=1&music_info=1`
    };
  }

  throw new Error('Only Facebook, Instagram, and TikTok reel URLs are supported.');
}

export function validateStoreHighlight(body) {
  const title = String(body?.title || '').trim();
  if (!title || title.length > 120) {
    return { error: 'Enter a title between 1 and 120 characters.' };
  }

  const url = String(body?.sourceUrl || body?.url || '').trim();
  let embed;
  try {
    embed = getStoreHighlightEmbed(url);
  } catch (error) {
    return { error: error.message };
  }

  const coverImage = String(body?.coverImage || '').trim();
  if (coverImage.length > 2048) {
    return { error: 'Cover image URL must be 2048 characters or fewer.' };
  }
  if (coverImage) {
    try {
      const coverUrl = new URL(coverImage);
      if (coverUrl.protocol !== 'https:') throw new Error();
    } catch {
      return { error: 'Cover image must be a valid HTTPS URL.' };
    }
  }

  const order = Number(body?.order ?? 0);
  if (!Number.isInteger(order) || order < 0) {
    return { error: 'Display order must be a non-negative whole number.' };
  }
  if (body?.isActive !== undefined && typeof body.isActive !== 'boolean') {
    return { error: 'Active status must be true or false.' };
  }
  if (body?.isPinned !== undefined && typeof body.isPinned !== 'boolean') {
    return { error: 'Pinned status must be true or false.' };
  }

  return {
    data: {
      title,
      sourceUrl: url,
      platform: embed.platform,
      coverImage,
      isPinned: body?.isPinned === true,
      order,
      isActive: body?.isActive !== false
    },
    embed
  };
}