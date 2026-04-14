// Web presets are now managed entirely from the database (sitemap_webs table).
// This file is kept for type exports only.

export interface WebPreset {
  id: string;
  name: string;
  description: string;
  pages: any[]; // SitemapPage[]
}

// No hardcoded presets — all webs are created/managed by admins via the UI.
export const WEB_PRESETS: WebPreset[] = [];
