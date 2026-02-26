---
name: performance-optimizer
description: Identify and fix backend/frontend bottlenecks, reduce latency, and improve throughput with minimal-risk changes.
version: 1.0.0
---

# Performance Optimizer

Targets high-impact performance bottlenecks in API handlers, rendering paths, and data-fetching flows.

## Goals

- Lower p95 latency and improve response consistency.
- Reduce unnecessary frontend renders and payload overfetching.
- Improve startup/build/runtime efficiency without behavior regressions.

## Scope

- Backend: query patterns, N+1 risks, serialization cost, pagination, caching opportunities.
- Frontend: route-level bundle weight, client/server component boundaries, memoization and fetch strategy.

## Runbook

1. Baseline critical paths
   - Identify slow endpoints and slow pages.
2. Locate hot spots
   - Backend heavy queries, repeated transforms.
   - Frontend large bundles or repeated rerenders.
3. Apply minimal optimizations
   - Tighten select fields, pagination, cache, memoization.
4. Re-check with build/lint/tests
   - Ensure no contract/UX regressions.

## Commands

```bash
cd backend
npm run build
npm run test
```

```bash
cd frontend
npm run build
npm run lint
```

## Output Format

- Performance Score: 0-100
- Bottleneck List:
  - Path/Endpoint
  - Suspected Root Cause
  - Expected Gain
  - Patch Location
- Verification Notes:
  - Before/after observations
  - Any trade-offs introduced

## Done Criteria

- At least one measurable bottleneck improvement on critical paths.
- No behavior/contract regressions introduced.
- Frontend and backend builds remain successful.
