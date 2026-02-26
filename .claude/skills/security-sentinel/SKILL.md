---
name: security-sentinel
description: Audit and harden backend/frontend security posture including auth, input validation, secrets, and transport safety.
version: 1.0.0
---

# Security Sentinel

Performs practical application security checks focused on authentication, authorization, validation, and secret handling.

## Goals

- Prevent authz bypasses and insecure data exposure.
- Ensure input validation and output sanitization are enforced.
- Reduce token/session and secret-leak risk.

## Scope

- Backend: auth modules, guards, interceptors, DTO validation, config loading, headers/cors/rate-limiting.
- Frontend: token storage/access, auth flows, API error handling, user-input rendering paths.

## Security Checklist

1. Authentication
   - JWT expiry, refresh logic, rotation patterns.
   - Password hashing and credential handling.
2. Authorization
   - Route-level guard coverage and role checks.
   - Horizontal privilege checks on user-owned resources.
3. Input/output protection
   - DTO validation on all mutable endpoints.
   - Avoid unsafe HTML rendering of user-provided content.
4. Transport and headers
   - Helmet/CORS configuration sanity.
   - Sensitive headers and cookie flags where applicable.
5. Secrets and config
   - No credentials hardcoded in source.
   - `.env` usage + secure defaults in examples/docs.

## Commands

```bash
cd backend
npm run lint
npm run test
```

```bash
cd frontend
npm run lint
npm run build
```

## Output Format

- Security Score: 0-100
- Findings:
  - Category
  - Risk
  - Evidence Path
  - Recommended Minimal Fix
- Priority Fix Queue:
  - P0 immediate
  - P1 sprint
  - P2 backlog

## Done Criteria

- All exploitable/high findings patched or blocked by compensating controls.
- Auth and critical write endpoints are validated and authorized.
- No plaintext secrets committed in project files.
