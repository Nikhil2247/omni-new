---
name: omni-quality-gate
description: Orchestrate all Omnicassion quality skills and produce a single release-readiness score with prioritized fixes.
version: 1.0.0
---

# Omni Quality Gate

Runs the full quality pipeline across backend and frontend, then aggregates findings into one release-readiness report.

## Skills Orchestrated

1. `contract-guardian`
2. `security-sentinel`
3. `reliability-robustness-engineer`
4. `performance-optimizer`
5. `flow-optimizer`

## Execution Order

Run in fixed order to reduce regressions:

1. Contract correctness
2. Security hardening
3. Reliability/robustness
4. Performance tuning
5. Flow optimization

## Aggregate Scoring

Use weighted score to reflect production risk:

- Contract: 25%
- Security: 25%
- Reliability: 20%
- Performance: 15%
- Flow: 15%

Formula:

`overall = contract*0.25 + security*0.25 + reliability*0.20 + performance*0.15 + flow*0.15`

## Gate Thresholds

- **Pass**: overall >= 85 and no critical/high unresolved security or contract issues.
- **Conditional Pass**: overall 75-84 with clear mitigation plan.
- **Fail**: overall < 75, or any unresolved critical issue.

## Unified Output Format

- Overall Readiness Score: 0-100
- Gate Decision: pass / conditional-pass / fail
- Top Blocking Issues (max 10):
  - Domain
  - Severity
  - File/Module
  - Minimal fix
- Ordered Remediation Plan:
  - Must-fix before merge
  - Should-fix this sprint
  - Can defer safely

## Commands Baseline

```bash
cd backend
npm run lint
npm run test
npm run build
```

```bash
cd frontend
npm run lint
npm run build
```

## Done Criteria

- Unified report generated with weighted score and decision.
- All critical blockers either fixed or explicitly waived with rationale.
- Backend/frontend checks pass after applied fixes.
