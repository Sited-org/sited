
# Plan: Scroll Reveals, Mobile Hardening, and Theme Toggle Fix

## 1. Fix Theme Toggle Consistency

**Problem**: After the first toggle, the overlay's CSS `transition` property gets manually overwritten (line 72: `opacity 0.3s ease`) and then cleared (line 76: `""`). On subsequent toggles, the expansion transition (`transform 0.5s cubic-bezier(...)`) is missing because the inline style from JSX only applies on mount.

**Fix**: Instead of clearing `transition` to `""`, explicitly restore the full base transition string every time:
```
overlay.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease";
```
This ensures every toggle cycle starts with the correct expansion transition.

---

## 2. Prevent Horizontal Scrolling Site-Wide

Add a global CSS rule to `index.css`:
```css
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
```
Also audit existing `overflow-x-hidden` on page wrappers -- some pages already have it (Features, Work) but Index and Contact do not. Add `overflow-x-hidden w-full` to the outer wrapper div on Index and Contact as well.

---

## 3. Add ScrollReveal to More Sections

Wrap additional elements across pages with the existing `ScrollReveal` component. Specific placements:

### Index (`/`)
- Proof bar items: wrap each item with ScrollReveal (direction: up, staggered delay)
- Client Websites Grid heading + grid: wrap in ScrollReveal
- "Why People Stay" cards: wrap each card with ScrollReveal (alternating left/right)
- Services cards: wrap each card with ScrollReveal (staggered up)
- Process steps: wrap each step with ScrollReveal (direction: up, staggered)
- Final CTA section: wrap in ScrollReveal (direction: scale)

### Work (`/portfolio`)
- Hero subtitle and CTA buttons: wrap in ScrollReveal
- Social proof strip stats: wrap each stat in ScrollReveal
- "Why Sited" transition heading/text: wrap in ScrollReveal
- Bottom CTA: wrap in ScrollReveal

### Contact (`/contact`)
- Hero text block: already using motion -- convert to ScrollReveal for consistency
- Testimonial cards: wrap each in ScrollReveal (staggered, direction: up)
- Bottom CTA block: wrap in ScrollReveal

### Custom Websites (`/custom-websites`)
- Hero section heading: already animated
- Tier showcase cards: already have motion -- these are fine
- Testimonial section: wrap cards in ScrollReveal
- Blog posts section: wrap each post card in ScrollReveal
- Final CTA: wrap in ScrollReveal

---

## 4. Technical Details

### Files to Edit
1. **`src/components/common/ThemeToggleFloat.tsx`** -- Fix the transition reset on line 76
2. **`src/index.css`** -- Add `overflow-x: hidden` to `html, body`
3. **`src/pages/Index.tsx`** -- Import ScrollReveal, wrap proof bar items, "Why People Stay" cards, services cards, process steps, and final CTA; add `overflow-x-hidden` to outer div
4. **`src/pages/Work.tsx`** -- Wrap social proof stats, "Why Sited" section content, and bottom CTA in ScrollReveal
5. **`src/pages/Contact.tsx`** -- Add `overflow-x-hidden` to outer div, wrap testimonial cards and bottom CTA in ScrollReveal
6. **`src/pages/CustomWebsites.tsx`** -- Wrap testimonial cards, blog post cards, and final CTA in ScrollReveal

### Approach
- Use the existing `ScrollReveal` component everywhere -- no new components needed
- Stagger delays within groups (0.05-0.1s increments) for a cascading effect
- Use directional variety: headings from "up", cards from alternating "left"/"right", CTAs from "scale"
- Keep `once: true` on all reveals so they only animate in once
- All ScrollReveal wrappers use `overflow-hidden` implicitly through the parent page wrapper, preventing any horizontal scroll from off-screen initial positions
