/**
 * Maps supported client website URLs to pre-captured screenshot files.
 * Returns null when no screenshot has been captured yet.
 */
const SCREENSHOT_SLUGS: Record<string, string> = {
  "hunterinsight.com.au": "hunterinsight",
  "www.hunterinsight.com.au": "hunterinsight",
  "inglebrown.com.au": "inglebrown",
  "www.inglebrown.com.au": "inglebrown",
  "inglebrown.sited.co": "inglebrown",
  "www.inglebrown.sited.co": "inglebrown",
  "wisdomeducation.org": "wisdomeducation",
  "www.wisdomeducation.org": "wisdomeducation",
};

export function getScreenshotUrl(websiteUrl: string): string | null {
  try {
    const normalizedUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    const hostname = new URL(normalizedUrl).hostname.toLowerCase();
    const slug = SCREENSHOT_SLUGS[hostname];

    if (!slug) return null;

    return `https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/${slug}-full.png`;
  } catch {
    return null;
  }
}
