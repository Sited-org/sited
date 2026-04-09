

# Admin Sitemaps Builder — Plan

## Overview

A new admin page at `/admin/sitemaps` that lets admins create visual sitemap PDFs for client projects. Sitemaps can be built from scratch or pre-populated from a client's discovery form answers. The PDF output is a Sited-branded landscape document showing the page hierarchy across multiple sheets (Front-End, Admin Portal, Client Portal, Staff Portal, etc.).

## Data Model

New table: `project_sitemaps`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| lead_id | uuid FK → leads | nullable (scratch sitemaps) |
| build_flow_id | uuid FK → build_flows | nullable |
| name | text | e.g. "Acme Corp Sitemap" |
| sections | jsonb | Array of `{ title: string, pages: { name: string, children?: string[] }[] }` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Each "section" becomes one landscape PDF page (Front-End, Admin Portal, etc.). Pages within a section can have children to show hierarchy.

## UI — Admin Sitemaps Page (`/admin/sitemaps`)

**Top bar**: Title "Sitemaps" + "New Sitemap" button

**Sitemap list**: Table showing existing sitemaps (name, linked client, section count, created date) with Edit/Download/Delete actions.

**Create/Edit dialog** (full-screen sheet):
1. **Client selector** — optional dropdown of leads. When selected, offers "Import from Discovery" button that auto-populates sections from `discovery_answers` (selectedPortals, frontEnd.corePages, frontEnd.marketingPages, frontEnd.customPages, adminPortal.features, clientPortal.features, staffPortal.features).
2. **Section builder** — tab-based interface. Each tab = one PDF page. Add/remove/rename sections. Within each section, add pages with optional child pages (drag or indent).
3. **Preview & Download** — generates the branded PDF client-side using jsPDF (same pattern as ProposalGenerator).

## PDF Generation

- **Format**: A4 landscape (841.89 x 595.28 pt)
- **Margins**: 2cm sides (~56.7pt), 1cm top/bottom (~28.35pt)
- **Branding**: "Sited.co" header top-left, section title top-right, footer with "Sited · Web Design & Development"
- **Layout**: Tree/hierarchy diagram — root node (section title) at left, child pages branching right with connecting lines. Clean, minimal style using the same Slate colour palette as the SOW PDF.
- **Multi-page**: One PDF page per section. All sections combined into a single downloadable PDF.

## Routing & Navigation

- Add "Sitemaps" nav item in AdminLayout (below "Analysis AI"), using `Map` icon from lucide-react
- Add route `/admin/sitemaps` in App.tsx
- New page: `src/pages/AdminSitemaps.tsx`

## Files

| # | File | Change |
|---|------|-------|
| 1 | Migration | Create `project_sitemaps` table with RLS (admin-only CRUD) |
| 2 | `src/pages/AdminSitemaps.tsx` | New — sitemap list + create/edit sheet + PDF generation |
| 3 | `src/components/admin/AdminLayout.tsx` | Add "Sitemaps" to navItems |
| 4 | `src/App.tsx` | Add lazy import + route for AdminSitemaps |

## Technical Details

- PDF generated client-side with jsPDF (already a project dependency)
- Discovery answers fetched via `discovery_answers` table keyed by `build_flow_id`
- Import logic maps: `selectedPortals` → sections, `frontEnd.corePages` + `frontEnd.marketingPages` + `frontEnd.customPages` → Front-End pages, portal features → respective portal pages
- Tree rendering in PDF: horizontal tree layout with rounded-rect nodes and bezier connector lines
- RLS: `is_admin(auth.uid())` for all operations

