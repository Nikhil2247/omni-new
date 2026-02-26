---
name: flow-optimizer
description: Optimize end-to-end user and business flows across frontend UX and backend orchestration.
version: 1.0.0
---

# Flow Optimizer

Improves end-to-end business and user flows by reducing friction, latency, and failure points between UI and APIs.

## Goals

- Simplify critical journeys and reduce step failures.
- Ensure backend orchestration supports predictable flow completion.
- Improve user-perceived speed and completion rate.

## Candidate Flows

- Authentication and onboarding
- Lead capture and conversion
- Messaging interactions
- Vendor/business operations journeys

## Runbook

1. Map the flow
   - Trigger, intermediate states, terminal states, failure branches.
2. Detect friction
   - Extra API calls, duplicate validation, avoidable page transitions.
3. Optimize handoffs
   - Align backend payloads to frontend needs (no over/under-fetch).
4. Improve resilience
   - Add retries, optimistic UI, and clearer recoverable errors as needed.
5. Validate end-to-end behavior
   - Ensure no state dead-ends.

## Commands

```bash
cd backend
npm run test
npm run build
```

```bash
cd frontend
npm run lint
npm run build
```

## Output Format

- Flow Health Score: 0-100
- Flow Map Summary:
  - Current path
  - Pain points
  - Proposed optimized path
- Change List:
  - Backend updates
  - Frontend updates
  - Risk checks

## Done Criteria

- Critical flow has fewer steps, fewer failure points, or lower wait time.
- Flow completes successfully in normal and degraded cases.
- Build/lint/test checks remain green.
