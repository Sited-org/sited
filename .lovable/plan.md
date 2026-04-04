

# Make Website Showcases Dynamic (Admin-Controlled)

## Current State

- `/go` page: **Already dynamic** — reads from your testimonials in admin settings. Any testimonial with a website URL and "Show on Homepage" enabled will appear.
- Homepage grid, Portfolio grid, Offer page: **Hardcoded** to Hunter Insight, Ingle & Brown, Wisdom Education.

## Plan

Make all showcase components pull from the same testimonials data so you can control which websites appear everywhere from the admin Testimonials section.

| # | File | Change |
|---|------|--------|
| 1 | `src/components/home/ClientWebsiteGrid.tsx` | Replace hardcoded `SITES` array with a `useTestimonials` hook call; filter by `show_on_homepage = true` and `website_url` present; construct screenshot URL dynamically |
| 2 | `src/components/work/WebsiteShowcaseGrid.tsx` | Same — replace hardcoded `clientSites` with testimonials query; filter by active testimonials with `website_url` |
| 3 | `src/components/offer/SocialProofSection.tsx` | Same — replace hardcoded `showcaseSites` with testimonials query; filter by `show_on_homepage = true` |

### Screenshot URL convention

All components will derive the screenshot URL the same way the `/go` page already does:

```
https://xwjoqaflrynemntyzwmw.supabase.co/storage/v1/object/public/site-screenshots/{sanitized-domain}-full.png
```

So as long as the screenshot has been captured (via the existing capture edge function), it will display automatically.

### No database changes needed

The testimonials table already has `website_url`, `show_on_homepage`, `is_active`, and display order columns — everything required.

