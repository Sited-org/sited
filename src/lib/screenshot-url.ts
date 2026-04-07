/**
 * Returns the public URL for a testimonial's website screenshot.
 * The slug comes from the testimonial's `screenshot_slug` column.
 * Returns null when no slug is provided.
 */
export function getScreenshotUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return `https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/${slug}-full.png`;
}
