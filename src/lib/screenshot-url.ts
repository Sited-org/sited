/**
 * Derives the screenshot storage URL from a website URL.
 * Convention: strip protocol + slashes + dots → append "-full.png"
 */
export function getScreenshotUrl(websiteUrl: string): string {
  const sanitized = websiteUrl
    .replace(/https?:\/\//, '')
    .replace(/\//g, '')
    .replace(/\./g, '');
  return `https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/${sanitized}-full.png`;
}
