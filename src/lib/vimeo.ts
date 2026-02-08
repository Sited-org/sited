/**
 * Extract a Vimeo video ID from various Vimeo URL formats.
 * Supports: vimeo.com/123, vimeo.com/manage/videos/123, player.vimeo.com/video/123
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:vimeo\.com\/(?:manage\/videos\/|video\/)?|player\.vimeo\.com\/video\/)(\d+)/
  );
  return match ? match[1] : null;
}

/**
 * Get a Vimeo thumbnail URL from a video ID.
 * Uses vumbnail.com which is a free, reliable Vimeo thumbnail service.
 */
export function getVimeoThumbnail(videoId: string): string {
  return `https://vumbnail.com/${videoId}.jpg`;
}
