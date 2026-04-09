

# Sitemap Builder — Full-Page Redesign + Tabs Layer + Better Drag & Drop

## Problems
1. Builder renders inside `AdminLayout`, showing the admin sidebar — should be full-page standalone
2. Drag & drop only works for pages, not children, and has no visual feedback (drop indicators)
3. No "tabs" level — need a 4th hierarchy tier: Section → Page → Sub-page → Tab
4. Children are stored as `string[]` — need to become objects to support nested tabs

## Changes

### 1. Make builder a standalone route (`src/App.tsx`)
Move the two builder routes (`sitemaps/new` and `sitemaps/:id`) **outside** the `<Route path="/admin" element={<AdminLayout />}>` wrapper so they render without the admin sidebar. The list page (`/admin/sitemaps`) stays inside AdminLayout.

### 2. Restructure data types (`AdminSitemapBuilder.tsx`)
Upgrade the hierarchy to support tabs under sub-pages:

```typescript
interface SitemapTab {
  name: string;
}

interface SitemapChild {
  name: string;
  tabs?: SitemapTab[];
}

interface SitemapPage {
  name: string;
  children?: SitemapChild[];  // was string[]
}
```

This adds a 4th column on the canvas: Section → Pages → Sub-pages → Tabs.

### 3. Improved drag & drop with visual indicators
- Add a `dropTarget` state tracking which index is being hovered
- Render a blue highlight bar at the drop position during drag-over
- Support drag & drop for sub-pages (reorder within parent) and tabs (reorder within sub-page)
- Use `e.dataTransfer.setData()` / `getData()` properly for drag type identification

### 4. Full-page layout
- Remove the `-m-6 lg:-m-8` hack (no longer inside AdminLayout padding)
- Make the component render as `fixed inset-0` or `h-screen w-screen` so it truly fills the viewport
- Back arrow navigates to `/admin/sitemaps`

### 5. Tab management helpers
- `addTab(pIdx, cIdx)` — adds a tab under a sub-page
- `updateTab(pIdx, cIdx, tIdx, value)` — rename a tab
- `removeTab(pIdx, cIdx, tIdx)` — delete a tab
- Tab nodes rendered as a 4th column with their own SVG connectors (sub-page → tab)

### 6. Update SVG connector logic
Add connectors for the new sub-page → tab connections, using the same elbow pattern. Track tab node refs with a `tabNodeRefs` map keyed by `${pIdx}-${cIdx}-${tIdx}`.

### 7. Update PDF generation (`AdminSitemaps.tsx`)
- Handle `SitemapChild` objects instead of strings
- Add a 4th column for tabs in the PDF tree layout
- Draw connectors from sub-page nodes to tab nodes

### 8. Migrate existing data
Children stored as `string[]` need backward compat — on load, map `string` children to `{ name: string }` objects.

## Files Changed

| # | File | Change |
|---|------|--------|
| 1 | `src/App.tsx` | Move builder routes outside AdminLayout wrapper |
| 2 | `src/pages/AdminSitemapBuilder.tsx` | Full rewrite: standalone layout, new types with tabs, proper drag & drop with visual feedback, tab management, updated connectors |
| 3 | `src/pages/AdminSitemaps.tsx` | Update `generateSitemapPDF` to handle child objects + tabs column |

