/**
 * Derives a screenshot slug from a website URL.
 * e.g. "https://hunterinsight.com.au" → "hunterinsight"
 *      "https://www.inglebrown.com.au" → "inglebrown"
 *      "https://wetrpressurecleaning.com" → "wetrpressurecleaning"
 */
export function deriveScreenshotSlug(websiteUrl: string | null | undefined): string | null {
  if (!websiteUrl) return null;
  try {
    const hostname = new URL(websiteUrl).hostname; // e.g. "www.hunterinsight.com.au"
    // Remove www. prefix, then strip TLD parts (.com, .com.au, .net, etc.)
    const clean = hostname
      .replace(/^www\./, '')           // hunterinsight.com.au
      .replace(/\.(com|net|org|io|co|au|uk|nz|ca|us|dev|app|biz|info|me|tv|xyz|site|online|store|tech|design|agency|studio|digital|solutions|services|group|pro|space|website|world|zone|global|cloud|systems|marketing|consulting|media|build|page|shop|trade|works|live|click|link|plus|center|team|tools|support|direct|express|supply|health|care|dental|law|finance|house|property|realty|clean|cleaning|construction|plumbing|electrical|hvac|auto|fitness|beauty|salon|tattoo|food|restaurant|cafe|pizza|photography|video|music|art|yoga|wedding|travel|education|training|academy|school|church|charity|vet|pet|garden|farm|solar|energy|roofing|painting|flooring|fencing|landscaping|removals|moving|storage|courier|freight|transport|hire|rental|events|catering|flowers|gifts|toys|games|books|fashion|clothing|shoes|jewelry|watches|furniture|home|decor|appliances|electronics|computers|phones|security|insurance|accounting|legal|medical|physiotherapy|chiropractic|optometry|pharmacy|psychology|counseling|therapy)+/g, '')
      .replace(/\./g, '');             // hunterinsight
    return clean.toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * Returns the public URL for a testimonial's website screenshot.
 * Accepts either a pre-set slug or derives one from the website URL.
 * Returns null when no slug can be determined.
 */
export function getScreenshotUrl(slugOrUrl: string | null | undefined): string | null {
  if (!slugOrUrl) return null;
  // If it looks like a URL, derive the slug
  const slug = slugOrUrl.startsWith('http') ? deriveScreenshotSlug(slugOrUrl) : slugOrUrl;
  if (!slug) return null;
  return `https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/${slug}-full.png`;
}
