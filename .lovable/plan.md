

# Consistent Package Features & Comparison Chart Reorder

## Changes

### 1. Reorder comparison chart rows (`src/pages/Offer.tsx`)
Move "Calendar Integration" row to sit directly below "Email Integration" in the comparison table (lines ~893-908). New order:
- Professional Website → High-Converting Funnel → Lead Capture Forms → Lifetime Hosting → SEO Optimisation → Email Integration → **Calendar Integration** → Payment Integration → Admin Dashboard → ...

### 2. Fix inconsistencies across pages

**`src/pages/CustomWebsites.tsx`** (line 47):
- Blue tier still lists `"Calendar booking"` — remove it
- Gold tier should explicitly include `"Calendar integration"` (currently bundled vaguely under "Full integrations suite")

**`src/pages/LandingPage.tsx`** (line 40):
- Line item says `"Calendar & Email Integration"` — change to just `"Email Integration"` since Calendar is no longer in Blue

### 3. Summary of correct package breakdown

| Feature | Blue | Gold | Platinum |
|---------|------|------|----------|
| Professional website | Yes | Yes | Yes |
| High-converting funnel | Yes | Yes | Yes |
| Lead capture forms | Yes | Yes | Yes |
| Lifetime hosting | Yes | Yes | Yes |
| SEO (Basic/Extra/Premium) | Yes | Yes | Yes |
| Email integration | Yes | Yes | Yes |
| Calendar integration | **No** | **Yes** | Yes |
| Payment integration | No | Yes | Yes |
| Admin dashboard | No | Yes | Yes |
| Lead management CRM | No | Yes | Yes |
| Client portal | No | No | Yes |
| Staff portal | No | No | Yes |
| AI chatbot | No | No | Yes |
| Custom integrations | No | No | Yes |
| Priority support | No | No | Yes |

### Files changed

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/Offer.tsx` | Reorder comparison table: move Calendar Integration row below Email Integration |
| 2 | `src/pages/CustomWebsites.tsx` | Remove "Calendar booking" from Blue features; add "Calendar integration" to Gold features |
| 3 | `src/pages/LandingPage.tsx` | Change "Calendar & Email Integration" line item to "Email Integration" |

