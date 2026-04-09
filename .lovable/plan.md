

# Redesign: Interactive Drag & Drop Sitemap Builder

## Overview

Replace the current sheet-based editor with a dedicated full-page builder at `/admin/sitemaps/:id` (and `/admin/sitemaps/new`). The list page stays at `/admin/sitemaps`. The builder is a visual canvas where nodes are dragged, connected, and edited inline — similar to tools like Octopus.do or FlowMapp.

## Architecture

```text
/admin/sitemaps          → List page (table of saved sitemaps)
/admin/sitemaps/new      → Builder (new sitemap)
/admin/sitemaps/:id      → Builder (edit existing sitemap)
```

## Builder UI Design

Full-screen canvas layout inside AdminLayout:

- **Top toolbar**: Sitemap name (editable inline), client selector, Import from Discovery button, Save button, Download PDF button, Back arrow
- **Left sidebar** (collapsible, ~240px): Section tabs (Front-End, Admin Portal, etc.) with add/remove. Each section lists its pages as draggable items. Add Page / Add Sub-page buttons.
- **Main canvas**: Visual tree diagram rendered with HTML/CSS nodes and SVG connector lines. The section root node sits on the left, page nodes in the middle column, sub-page nodes on the right. Nodes are:
  - Draggable (reorder within their column via drag & drop using `@dnd-kit/core`)
  - Click-to-edit name inline
  - Right-click or hover menu: rename, add child, delete
  - Connected by smooth SVG bezier lines that update on drag

### Node Layout
- **Root node** (dark, section title) → fixed left position
- **Page nodes** (blue) → middle column, vertically spaced, draggable to reorder
- **Sub-page nodes** (light gray) → right column, grouped under parent page, draggable to reorder

### Interactions
- Drag page nodes to reorder vertically
- Drag sub-pages between parent pages
- Click node to select → inline text editing
- "+" button on each page node to add a sub-page
- "+" button at bottom of page column to add a new page
- Delete via X button or keyboard Delete key on selected node
- Section tabs switch which tree is displayed on canvas

## PDF Fix

Rewrite the tree connector logic. Current issue: bezier curves use `doc.lines()` with incorrect control points. Fix:
- Use simple `doc.line()` calls with an elbow/step connector pattern (horizontal out → vertical → horizontal in)
- Root → Page: horizontal line from root right edge, vertical step to page center-Y, horizontal into page left edge
- Page → Child: same elbow pattern from page right edge to child left edge
- This guarantees lines always connect to the correct nodes regardless of vertical position

## Files Changed

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/AdminSitemaps.tsx` | Simplify to list-only page; navigate to builder on edit/create |
| 2 | `src/pages/AdminSitemapBuilder.tsx` | **New** — full-page drag & drop builder with canvas, sidebar, toolbar, PDF generation with fixed connectors |
| 3 | `src/App.tsx` | Add lazy import + routes for `/admin/sitemaps/new` and `/admin/sitemaps/:id` |

## Technical Details

- **Drag & drop**: Use HTML5 drag events (no new dependency needed) — `onDragStart`, `onDragOver`, `onDrop` for reordering pages and sub-pages within the visual tree
- **SVG connectors**: Rendered as an absolutely-positioned SVG overlay on the canvas, recalculated on node position changes using `getBoundingClientRect()` of each node ref
- **PDF connectors fix**: Replace bezier `doc.lines()` with elbow connectors using three `doc.line()` calls per connection: `(startX, startY) → (midX, startY) → (midX, endY) → (endX, endY)`
- **Canvas scrolling**: Container with `overflow: auto` for large sitemaps; nodes positioned via flexbox columns with CSS gap
- **Inline editing**: Click node → transforms into an `<input>` field; blur/Enter saves

