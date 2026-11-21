// Cloudinary delivery helpers. Non-Cloudinary URLs are returned unchanged.
// We deliberately do NOT use f_auto: it can serve AVIF, which older Android
// WebViews / image decoders cannot display.

const MARKER = '/upload/';

function withTransform(url: string, transform: string) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes(MARKER)) {
    return url;
  }
  // Don't double-apply if a transform is already present.
  const [head, tail] = url.split(MARKER);
  if (/^(c_|w_|h_|q_)/.test(tail)) return url;
  return `${head}${MARKER}${transform}/${tail}`;
}

/** Small cropped card thumbnail (4:3). */
export function thumbUrl(url?: string, width = 640) {
  if (!url) return '';
  const height = Math.round((width * 3) / 4);
  return withTransform(url, `c_fill,g_auto,w_${width},h_${height},q_auto`);
}

/** Large image for the full-screen preview. */
export function fullUrl(url?: string) {
  if (!url) return '';
  return withTransform(url, 'c_limit,w_1600,q_auto');
}
