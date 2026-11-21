# SEO action plan (from the Nov 2026 audit)

## Baseline (Search Console, 3 months to 2026-11-19)
| Metric | Value |
|---|---|
| Clicks | 28 |
| Impressions | 7.74K |
| CTR | 0.4% |
| Avg position | 49.3 |
| Indexed pages | 58 |
| Not indexed | ~1,500 (799 noindex, 517 crawled-not-indexed, 7 x 404, 2 soft 404) |

Brand search ("omnicassion") ranks #1 with sitelinks. Non-brand terms are weak
(e.g. "wedding planners chandigarh" pos 73, `/digital-invite-generator` pos 80 with 1,280 impressions).

## Done in code
- Categories are resolved from the backend (`resolveCategorySlug` in `src/lib/seo/landing.ts`), not hardcoded.
  Legacy slugs such as `/vendors/wedding-planning/chandigarh` 301 to the real category slug.
- Unknown vendor / category / city pages return a real 404 (no more 200 "soft 404" + noindex).
- `www.omnicassion.com` 301s to `omnicassion.com`.
- Homepage / default / Open Graph / Twitter titles are consistent; unverified "#1" and "50,000+" claims removed.

## Needs action outside the code
1. **Production API**: `/api/public/discovery/categories`, `/api/public/lookups/vendor-landing-pages` and
   `/api/public/discovery/vendors` returned HTTP 500 ("unexpected database error") on 2026-11-21.
   SEO pages and the sitemap depend on these. Check the production DB / API logs first.
2. Deploy, then in Search Console: Validate fix on "Excluded by noindex", "Soft 404", "Not found (404)".
3. URL Inspection -> Request indexing for the top ~20 pages (home, planners/chandigarh, digital-invite-generator,
   azalea, indradhanush-auditorium, community-centre-sector-46).
4. Move `blog.omnicassion.com` to `omnicassion.com/blog` (301) to consolidate authority.

## Content (weeks 3-4)
- City x category hubs for the markets already getting impressions: Chandigarh, Zirakpur, Lucknow, Ahmedabad.
  Add real copy: price ranges, how to choose, FAQs, links to vendors.
- Rewrite titles/descriptions for page-1 vendor pages with low CTR (azalea 515 impr @ 12.3, indradhanush 310 @ 9.7).
- Expand `/digital-invite-generator` (templates gallery, regional styles, WhatsApp sharing guide).

## Re-measure weekly
Clicks, impressions, CTR, avg position, indexed vs not-indexed, top queries; compare with the baseline above.
