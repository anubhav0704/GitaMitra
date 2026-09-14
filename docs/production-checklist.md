# GitaMitra Production Readiness Checklist

## 1. Security & Authentication
- [x] Passwords hashed securely using bcrypt.
- [x] JWT sessions stored in HttpOnly, SameSite cookies.
- [x] Configurable rate limiting enabled on Auth, Chat, Voice, RAG, and Memory APIs.
- [x] HTTP Security Headers configured (nosniff, DENY frame options, Referrer Policy).
- [x] CORS restricted to explicit environment allowed origins.
- [x] Input validation & payload bounds enforced (2,000 char max input, 10MB audio limit).
- [x] Log redaction strips passwords, bearer tokens, and credentials.

## 2. AI Cost Protection & Reliability
- [x] Per-user message length limits and history truncation.
- [x] Max RAG retrieval candidate bounds (top-k=5).
- [x] Graceful AI provider fallback (STT -> typed text, TTS -> markdown text).
- [x] Emergency self-harm and crisis trigger defense priority over persona.

## 3. Database & Memory Performance
- [x] PostgreSQL connection pooling configured (pool_size=10, max_overflow=20).
- [x] User-isolated queries on all private endpoints.
- [x] Database indexes on users, conversations, messages, memories, and gita_verses.
- [x] Backup & restore strategy documented in `docs/backups.md`.

## 4. Observability & Health Checks
- [x] Request ID (`X-Request-ID`) attached to all HTTP requests and logs.
- [x] `/api/health/live` and `/api/health/ready` endpoints active.
- [x] In-memory system metrics collector for user activity, latencies, and error rates.

## 5. Administration & Governance
- [x] Role-Based Access Control (`UserRole.USER`, `UserRole.ADMIN`).
- [x] Admin authorization dependency (`require_admin`).
- [x] `/admin` interactive dashboard with 7 management modules.
- [x] Admin audit logging for status changes, role updates, and dataset rebuilds.

## 6. Privacy & Legal Compliance
- [x] Full user data export (`GET /api/auth/account/export`).
- [x] Permanent user account deletion with cascade cleanup (`DELETE /api/auth/account`).
- [x] Public legal trust pages (Privacy Policy `/privacy`, Terms `/terms`, Disclaimer `/disclaimer`).
