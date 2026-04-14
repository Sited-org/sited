

# Sitemap Builder Upgrade: Cross-Dimensional Drag & Drop + Functions Panel with Webs

## Overview

Two major features for the sitemap builder: (1) allow dragging items between different hierarchy levels (e.g. a child from one page to another, a page becoming a child, etc.), and (2) a floating "Functions" panel with pre-made "Webs" that can be dropped into the sitemap.

---

## Feature 1: Cross-Dimensional Drag & Drop

**Current limitation**: Drag-and-drop only reorders within the same type and same parent (pages reorder among pages, children reorder within the same parent page, tabs within the same child). The code explicitly checks `currentDrag.type === currentTarget.type` and same parent indices.

**Changes needed**:

- **Expand `DragItem` and `DropTarget`** to allow cross-type drops. Add `sIdx` to DragItem so section context travels with the drag.
- **Update `data-drop-*` attributes** on all droppable elements to accept items from different hierarchy levels (e.g. a page node should accept a child being dropped on it to reparent).
- **Update the `onPointerMove` hit-test** to allow cross-type matching — when dragging a child, hovering over a different page's drop zone should highlight it as a valid target.
- **Update `onPointerUp` drop logic** to handle:
  - Child → different parent page (move child with all its tabs/sub-tabs)
  - Page → child of another page (demote with children intact)
  - Child → top-level page (promote)
  - Tab → child under a different parent (promote tab to child)
- **All sub-labels travel with the dragged item** — already natural since children/tabs are nested objects; the move just splices the entire object.

**Key constraint**: When dragging across dimensions, `linkedFrom` references may need cleanup if page indices shift.

---

## Feature 2: Functions Panel with Webs

**UI**: A floating, draggable, minimizable panel anchored to the right side of the canvas.

**Components**:
1. **FloatingFunctionsPanel** — a `position: fixed` div with drag handle, minimize toggle, and two tabs: "Library" and "My Webs"
2. **Library tab** — pre-built web templates (hardcoded):
   - **Sales Funnel** — Landing Page → Lead Capture (popup) → Thank You → Follow Up (tabs: Email Sequence, Retargeting)
   - **User Profile Area** — Profile → Settings (tabs: Account, Security, Notifications) → Activity Log
   - **Blog Section** — Blog Index → Blog Post → Categories → Author Page
   - **E-Commerce** — Products → Product Detail → Cart → Checkout (tabs: Shipping, Payment, Review) → Order Confirmation
   - **Auth Flow** — Login → Register → Forgot Password → Reset Password → Email Verification
   - **Support Center** — Help Center → FAQ → Contact → Ticket System (tabs: Open, Resolved)
3. **My Webs tab** — user-created webs stored in a new database table `sitemap_webs`
4. **Each web item** shows a name, page count badge, and a "Drop into sitemap" button or drag handle
5. **Creating a Web** — a dialog where user names the web, then builds a mini-tree (reusing the same node structure: pages with children and tabs). Saved to `sitemap_webs` table.
6. **Dropping a Web** — clicking "Add to sitemap" appends the web's pages array to the current section's pages, or the user can drag the web onto a specific page to insert its children there.

**Database**: New `sitemap_webs` table:
```sql
create table public.sitemap_webs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  pages jsonb not null default '[]',
  is_preset boolean default false,
  created_at timestamptz default now()
);
alter table public.sitemap_webs enable row level security;
create policy "Authenticated users can manage webs"
  on public.sitemap_webs for all to authenticated using (true) with check (true);
```

---

## Files to Modify/Create

| File | Action |
|---|---|
| `src/pages/AdminSitemapBuilder.tsx` | Expand drag/drop logic for cross-dimensional moves; add Functions panel rendering and state |
| `src/components/admin/sitemap/FloatingFunctionsPanel.tsx` | New — floating draggable panel with Library + My Webs tabs |
| `src/components/admin/sitemap/WebBuilderDialog.tsx` | New — dialog for creating/editing custom webs |
| `src/components/admin/sitemap/webPresets.ts` | New — hardcoded preset web templates |
| Migration | New table `sitemap_webs` |

---

## Technical Details

**Cross-dimensional drop resolution**: The `onPointerMove` handler will be updated to find the nearest valid drop zone regardless of type. A new `data-drop-accepts` attribute will define which drag types each zone accepts (e.g. a page node accepts `child`, `tab` for promotion; a child area accepts `page` for demotion). The `onPointerUp` handler will use a switch on `${dragType}->${dropType}` to execute the correct splice/insert operation.

**Floating panel drag**: Uses `onPointerDown` on a grip bar, tracking `clientX/clientY` delta to update `top/left` state on a `position: fixed` container. Minimizing collapses to just the title bar.

**Web insertion**: When a preset/custom web is added, its `pages` array (which uses the same `SitemapPage[]` structure) is concatenated to `currentSection.pages`. Color indices auto-assign via the existing palette system.

