# Omnicassion Claude Skills

Project-specific skills for backend/frontend contract verification, security hardening, reliability, performance, and flow optimization.

## Skills

- `omni-quality-gate`  
  Master orchestrator that runs all skills and outputs one release-readiness score.

- `contract-guardian`  
  Verify DTO and API contract alignment between NestJS backend and Next.js frontend.

- `security-sentinel`  
  Audit authentication, authorization, validation, secrets, and secure defaults.

- `reliability-robustness-engineer`  
  Harden failure handling, graceful degradation, and crash resistance.

- `performance-optimizer`  
  Find and fix high-impact backend/frontend bottlenecks.

- `flow-optimizer`  
  Optimize end-to-end business/user flows for speed and completion reliability.

## Suggested Usage

Use one skill at a time for focused work, or start with the master gate:

1. `omni-quality-gate`

Or run manually in this order:

1. `contract-guardian`
2. `security-sentinel`
3. `reliability-robustness-engineer`
4. `performance-optimizer`
5. `flow-optimizer`

This order minimizes regressions by fixing API correctness and safety first, then tuning resilience and performance.

## Reusable Prompt

- Use [OMNI_QUALITY_GATE_PROMPT.md](OMNI_QUALITY_GATE_PROMPT.md) as a copy/paste Claude Code prompt to run a strict production-readiness audit (security, efficiency, reliability, and multi-user scalability).
