# GitaMitra Production Audit & Security Assessment

## Executive Summary
GitaMitra is a Bhagavad Gita-grounded AI companion built using Next.js (TypeScript, React, TailwindCSS) and FastAPI (Python, PostgreSQL + pgvector, Hybrid RAG, LLM Streaming, Voice STT/TTS).

This audit evaluates the codebase across Security, Reliability, Performance, Data Isolation, and Production Readiness prior to deployment.

---

## 1. Architectural Overview
- **Frontend**: Next.js 16 (App Router), TailwindCSS, Lucide Icons, Web Speech API & Web MediaRecorder voice client.
- **Backend API**: FastAPI, Async SQLAlchemy, Pydantic v2, SSE streaming.
- **Data Persistence**: PostgreSQL 15+ with `pgvector` extension for 384-dimensional dense verse embeddings.
- **RAG Engine**: Hybrid search combining dense cosine vector similarity and sparse keyword TF-IDF/BM25 retrieval.
- **AI Models**: LLM (Ollama/OpenAI API fallback), Whisper STT, Edge-TTS / Web Audio API.

---

## 2. Technical Debt & Risks

| Category | Risk / Issue | Severity | Proposed Fix | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Security** | Missing rate limits on Auth, Voice & Chat endpoints | High | Implement FastAPI rate-limiting middleware (`slowapi` / custom token bucket) | P0 |
| **Security** | Missing HTTP Security Headers (CSP, HSTS, X-Frame-Options) | High | Implement middleware to attach production security headers | P0 |
| **Security** | CORS allows localhost wildcard without environment control | Medium | Bind CORS origins to `CORS_ALLOWED_ORIGINS` env var | P0 |
| **Privacy** | Lack of automated user account deletion & full data export | High | Implement `DELETE /api/auth/account` & `GET /api/auth/account/export` | P1 |
| **Admin & RBAC** | No admin role or system management dashboard | High | Add `UserRole.ADMIN` and `/admin` management interface | P1 |
| **Performance** | Database connection pooling defaults unconfigured for scale | Medium | Configure `pool_size`, `max_overflow`, `pool_recycle` in SQLAlchemy | P1 |
| **Observability** | Logs lack `request_id` tracing and potential sensitive key leaks | Medium | Add Request ID middleware & log redactor for passwords/tokens | P1 |
| **Reliability** | No structured health check for dependency readiness (DB, vector, LLM) | Medium | Create `/api/health/live` and `/api/health/ready` endpoints | P1 |

---

## 3. Detailed Component Assessment

### A. Authentication & Session Management
- Passwords hashed using `bcrypt` / `passlib`.
- JWT tokens issued via cookies.
- Cookie flags: Add `HttpOnly`, `SameSite=Lax`, and `Secure` (when HTTPS enabled).

### B. User Isolation & Multi-Tenancy
- Every private endpoint (`conversations`, `memories`, `chat`) enforces user-scoped queries (`user_id == current_user.id`).
- All vector search queries filter embeddings by `user_id` or public dataset tags.

### C. Rate Limiting & Cost Protections
- Enforce max input length of 2,000 characters per message.
- Enforce max audio upload size of 10MB / 60 seconds duration.
- Enforce rate limits:
  - Auth: 10 requests / min
  - Chat SSE: 20 requests / min
  - Voice STT/TTS: 15 requests / min
  - RAG Search: 30 requests / min

---

## 4. Remediation Plan Matrix

1. **Phase 1: Core Hardening & Security Middleware** (Rate limiting, security headers, CORS restrictions, DB connection pooling).
2. **Phase 2: Admin System & RBAC** (`UserRole.ADMIN`, `require_admin` dependency, `/api/admin/*` endpoints, `/admin` dashboard frontend).
3. **Phase 3: Data Privacy & Account Governance** (Account deletion cascade, user data export JSON package).
4. **Phase 4: Health Monitoring & Metrics** (`/api/health/ready`, metrics collector, Request ID tracing).
5. **Phase 5: Production Documentation & Legal Pages** (Privacy, Terms, Disclaimer, Deployment, Backups, Incident Response).
