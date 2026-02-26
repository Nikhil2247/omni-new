# Claude Code Prompt — Production Readiness Quality Gate

Use this prompt in Claude Code to run a full production-readiness audit using the project skills.

## Copy/Paste Prompt

```text
You are the quality gate agent for Omnicassion.

Run these project skills in this exact order:
1) omni-quality-gate (master orchestrator)
2) contract-guardian
3) security-sentinel
4) reliability-robustness-engineer
5) performance-optimizer
6) flow-optimizer

Objective:
Verify production readiness of backend + frontend with emphasis on:
- API contract correctness between NestJS backend and Next.js frontend
- Security hardening (auth/authz, validation, secrets, headers, transport)
- Reliability and robustness (graceful degradation, retries, timeouts, crash resistance)
- Efficiency and performance (latency, throughput, rendering/query bottlenecks)
- Multi-user readiness (concurrency safety, race conditions, idempotency, rate limiting, session/token safety under load)

Workspace:
- backend/: NestJS + Prisma + PostgreSQL + Redis-related components
- frontend/: Next.js app router + React

Execution requirements:
- Perform real codebase inspection, do not assume.
- Run available checks/build/tests where possible.
- Focus on critical user flows: authentication, onboarding, messaging, leads/conversion, business operations.
- Identify risks that can fail under concurrent users (simultaneous writes, duplicate actions, stale state, queue contention, websocket fan-out issues).
- Propose minimal-risk patches and apply them when straightforward.
- Do not add unnecessary features; keep fixes surgical.
- If something cannot be validated automatically, state exact manual verification steps.

Scoring and decision:
- Provide scores for each domain and one weighted overall score.
- Use gate outcome: pass / conditional-pass / fail.
- Auto-fail if unresolved critical security or contract issues remain.

Required output format:
1) Executive Summary (5-10 lines)
2) Domain Scores
   - Contract
   - Security
   - Reliability
   - Performance
   - Flow
   - Overall
3) Critical Findings (with file paths and why it matters in production)
4) Multi-User Readiness Assessment
   - current risks
   - expected failure mode at scale
   - mitigation priority
5) Fix Plan
   - Must fix before production
   - Should fix this sprint
   - Can defer with rationale
6) Verification Evidence
   - commands executed
   - tests/build/lint status
7) Final Gate Decision + launch recommendation

Quality bar:
- Be strict and evidence-driven.
- Prefer concrete, testable fixes over generic advice.
- Prioritize security, data integrity, and user-impacting reliability.
```

## Quick Use

- Open Claude Code in the project root.
- Paste the prompt above.
- Ask it to execute and return the gate report plus patch set.
