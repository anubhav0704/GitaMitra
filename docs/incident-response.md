# GitaMitra Incident Response & Emergency Procedures

## 1. Severity Levels

| Severity | Definition | Action Required | Response SLA |
| :--- | :--- | :--- | :--- |
| **SEV-1** | Service completely down (DB crash, backend unhandled exception loop) | Immediate hotfix / rollback | < 15 mins |
| **SEV-2** | AI Provider Outage (LLM or Voice STT/TTS failing) | Fallback provider / Text-only mode | < 30 mins |
| **SEV-3** | Minor UI or non-critical feature glitch | Standard patch release | < 24 hours |

---

## 2. Emergency Operations

### A. Provider Outage & Graceful Fallbacks
- **LLM Failure**: If primary LLM provider fails, system returns structured error and falls back to fallback model or deterministic guidance.
- **STT Failure**: Voice input automatically falls back to typed text input with user notice.
- **TTS Failure**: Speech output falls back to rendering standard markdown text.

### B. Secret Rotation
If `JWT_SECRET`, database passwords, or provider API keys are compromised:
1. Update `.env.production` with new generated key: `openssl rand -hex 32`.
2. Restart backend service: `docker compose restart backend`.
3. Force re-authentication for all active user sessions by invalidating JWT secret.

### C. Admin Emergency Rollback
To revert to a previous container release:
```bash
docker compose down
git checkout <last-known-stable-commit>
docker compose up -d --build
```
