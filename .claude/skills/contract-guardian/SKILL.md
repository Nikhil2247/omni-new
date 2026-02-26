---
name: contract-guardian
description: Verify backend/frontend API contracts, DTO alignment, and response safety before merge.
version: 1.0.0
---

# Contract Guardian

Validates API contract correctness between NestJS backend and Next.js frontend.

## Goals

- Ensure frontend request/response shapes match backend DTOs and validators.
- Catch missing required fields, enum drifts, and nullable mismatches.
- Verify error payload consistency for robust client handling.

## Scope

- Backend: `backend/src/api/**/dto`, `backend/src/**/controllers/**`, class-validator decorators.
- Frontend: `frontend/src/lib/**`, `frontend/src/types/**`, API hooks/services, form payload builders.

## Runbook

1. Build a contract inventory
   - Enumerate gateway endpoints from backend controllers.
   - Map each endpoint to frontend callers.
2. Compare payload schemas
   - Request body/query/params vs frontend send payload.
   - Response DTO/entity shape vs frontend read paths.
3. Validate runtime guards
   - Ensure backend has validation/serialization guards.
   - Ensure frontend has safe parsing/fallback for optional fields.
4. Report drift and patch
   - Propose minimal edits to DTOs, types, or client parsers.

## Commands

### Backend checks

```bash
cd backend
npm run lint
npm run test
npm run build
```

### Frontend checks

```bash
cd frontend
npm run lint
npm run build
```

## Output Format

- Contract Score: 0-100
- Endpoint Drift Table:
  - Endpoint
  - Drift Type (required/optional mismatch, enum mismatch, shape mismatch, error shape mismatch)
  - Severity (high/medium/low)
  - Fix Location
- Patch Plan:
  - Minimal backend updates
  - Minimal frontend updates

## Done Criteria

- All high-severity contract drifts resolved.
- Backend and frontend both pass lint/build.
- No untyped `any` fallback added to hide drift.
