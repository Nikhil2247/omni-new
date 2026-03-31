---
name: seo-expert
description: "Use when improving search rankings, technical SEO, on-page SEO, schema markup, internal linking, crawlability, Core Web Vitals, and SEO content strategy for competitive keywords."
version: 1.0.0
---

# SEO Expert

Creates an actionable SEO plan and implementation checklist to help pages rank competitively against larger domains.

## Goals

- Improve crawlability, indexation quality, and relevance signals.
- Increase organic visibility for high-intent and long-tail queries.
- Strengthen topical authority through internal linking and content depth.
- Improve user experience metrics that influence search performance.

## Scope

- Technical SEO: indexation, crawl paths, canonicalization, robots, sitemaps, redirects.
- On-page SEO: titles, meta descriptions, headings, URL hygiene, semantic structure.
- Content SEO: search intent coverage, entity completeness, freshness, EEAT signals.
- Rich results: schema markup (Organization, WebSite, BreadcrumbList, FAQPage, Article/Product where relevant).
- Performance SEO: Core Web Vitals, render-blocking resources, media optimization.

## Workflow

1. Baseline
   - Identify target pages and primary keyword clusters.
   - Capture current rankings, indexed pages, CTR, and conversion baseline.
2. Technical Audit
   - Validate robots directives, canonical tags, sitemap integrity, and status codes.
   - Detect duplicate content, orphan pages, and thin indexable pages.
3. On-Page Audit
   - Ensure each page has one clear primary intent and supporting secondary intents.
   - Optimize title/H1 alignment, heading structure, and metadata uniqueness.
4. Content Gap Analysis
   - Compare competitor coverage for entities, FAQs, and supporting subtopics.
   - Add missing sections that satisfy informational and transactional intent.
5. Internal Link Architecture
   - Link related pages with descriptive anchors and hub-to-cluster patterns.
   - Prioritize links toward high-value pages with ranking potential.
6. Structured Data
   - Add valid JSON-LD schemas and verify required/recommended fields.
7. Performance Pass
   - Improve LCP, INP, and CLS via image sizing, lazy loading, script strategy, and caching.
8. Measurement Loop
   - Track rankings, impressions, CTR, and conversions weekly.
   - Re-prioritize backlog by expected impact and implementation effort.

## High-Impact Checklist

1. Indexability and crawl
   - No accidental `noindex` on money pages.
   - Canonical points to preferred URL and matches internal links.
   - XML sitemap includes only canonical, indexable, 200 URLs.
2. Relevance and intent
   - Title starts with value proposition + target term naturally.
   - Intro answers core intent within first 100 words.
   - Page includes supporting entities and FAQs users actually search.
3. Authority and trust
   - Clear author/business credibility and contact transparency.
   - Policy and trust pages are discoverable.
   - Important claims are evidence-backed and current.
4. CTR improvements
   - Meta descriptions are unique and benefit-driven.
   - Snippet language includes concrete outcomes and differentiators.
5. UX/performance
   - Largest above-the-fold media is optimized and dimensioned.
   - Layout shifts prevented with explicit size attributes.
   - Avoid heavy synchronous third-party scripts on initial render.

## Competitive Playbook

- Build topical clusters, not isolated pages.
- Refresh high-impression low-CTR pages first for fastest gains.
- Upgrade pages ranking positions 6-20 before chasing net-new terms.
- Reuse winning SERP formats: comparison tables, FAQ blocks, process steps, proof points.
- Prioritize pages that can convert, not just pages that can rank.

## Commands

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
npm run lint
npm run test
```

## Output Format

- SEO Score: 0-100
- Findings:
  - Category
  - Severity
  - Evidence Path
  - Why It Hurts Rankings
  - Minimal Safe Fix
- Priority Queue:
  - P0 (critical blockers)
  - P1 (high impact)
  - P2 (iterative improvements)
- 30-Day Plan:
  - Week 1 technical fixes
  - Week 2 on-page and schema
  - Week 3 internal links and content gaps
  - Week 4 re-measure and refine

## Done Criteria

- Critical technical blockers resolved.
- High-value pages have intent-aligned titles, headings, metadata, and schema.
- Internal links support topical clusters and priority conversions.
- Baseline metrics tracked with visible improvement trend over 2-4 weeks.
