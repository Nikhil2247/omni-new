---
name: reliability-robustness-engineer
description: Improve fault tolerance, graceful degradation, and runtime stability across backend and frontend.
version: 1.0.0
---

# Reliability & Robustness Engineer

Strengthens system behavior under failures, slow dependencies, malformed inputs, and partial outages.

## Goals

- Eliminate crash-prone paths and unhandled edge cases.
- Improve recoverability and predictable failure handling.
- Ensure critical user journeys degrade gracefully.

## Scope

- Backend: exception filters, retries/timeouts/circuit breakers, queue/job safety, idempotency.
- Frontend: loading/error states, retry UX, stale-cache behavior, defensive rendering.

## Runbook

1. Failure-mode mapping
   - Identify external dependency calls (DB, cache, search, notifications, storage).
2. Error-path verification
   - Confirm typed errors and consistent API error envelopes.
3. Timeout/retry policy checks
   - Validate bounded retries and backoff strategy.
4. Resilience hardening
   - Add safeguards for null/undefined payload branches.
5. Regression verification
   - Validate lint/build/tests after patches.

## Commands

```bash
cd backend
npm run test
npm run test:e2e
npm run build
```

```bash
cd frontend
npm run lint
npm run build
```

## Output Format

- Reliability Score: 0-100
- Top Failure Risks:
  - Scenario
  - Blast Radius
  - Current Behavior
  - Target Behavior
- Hardening Plan:
  - Immediate safeguards
  - Refactors for next iteration

## Done Criteria

- No known unhandled crash path in critical request flows.
- Consistent fallback behavior on dependency failures.
- Build and test pipelines remain green after changes.
