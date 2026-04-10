

## Plan: Multi-Parent Connector Lines in Builder + PDF

### Problem
1. The PDF ignores `linkedFrom` data entirely — only the "main" parent page's connector is drawn.
2. In the builder, the main parent's connector is solid while linked parents use dashed lines. The user wants **all** connectors to be dashed when a child has multiple parents, with no parent visually prioritised.

### Changes

#### 1. Builder connector logic (`AdminSitemapBuilder.tsx`)
- In `recalcConnectors`, when drawing the primary parent→child connector, check if `child.linkedFrom?.length > 0`. If so, mark those lines as `dashed: true` (same as the secondary connectors). This ensures all connections to a multi-linked node are visually equal.

#### 2. PDF multi-parent connectors (`AdminSitemaps.tsx`)
- After drawing each child node, check `child.linkedFrom`. For each linked parent index, draw an additional elbow connector from that parent page's Y-position to the child node, using:
  - The linked parent's page color
  - A **dotted/dashed** line style (matching the builder)
- When a child has `linkedFrom` entries, also switch the primary parent's connector to dashed, matching the builder behavior.
- Compute each linked parent's Y-position using the same layout formula already used for pages (based on `pageStartY + lpIdx * (pageH + pageGap)`).
- Add small colored dots at the child node for each linked parent (matching the builder's multi-dot indicator).

### Files Modified
- `src/pages/AdminSitemapBuilder.tsx` — Make primary connector dashed when child has linkedFrom
- `src/pages/AdminSitemaps.tsx` — Add linkedFrom connector rendering in `generateSitemapPDF`

