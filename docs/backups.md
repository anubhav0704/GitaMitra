# GitaMitra Database Backup & Recovery Strategy

## Overview
GitaMitra stores critical relational and vector data in PostgreSQL (`gitamitra` database) with `pgvector`. This document outlines the backup schedule, restore procedures, and validation steps.

---

## 1. Data Classification
1. **Relational Data**: `users`, `conversations`, `messages`, `memories`, `user_feedback`, `admin_audit_logs`.
2. **Vector Data**: `gita_verses`, `gita_embeddings` (dense vector embeddings of 700 verses).

---

## 2. Backup Methods

### A. Daily Automated Logical Backup (`pg_dump`)
```bash
# Executed via cron or systemd timer
docker exec -t gitamitra-db-1 pg_dump -U postgres -d gitamitra -F c -b -v -f /var/lib/postgresql/data/backups/gitamitra_$(date +%Y%m%d_%H%M%S).dump
```

### B. Gita Embeddings Backup Script
The Bhagavad Gita knowledge base and vector embeddings can also be re-generated idempotently at any time:
```bash
docker exec -t gitamitra-backend-1 python scripts/ingest_gita.py
```

---

## 3. Restoration Procedure

### Step 1: Prepare Clean Database
```bash
docker exec -it gitamitra-db-1 dropdb -U postgres --if-exists gitamitra
docker exec -it gitamitra-db-1 createdb -U postgres gitamitra
```

### Step 2: Restore from Dump File
```bash
docker exec -i gitamitra-db-1 pg_restore -U postgres -d gitamitra -v /var/lib/postgresql/data/backups/gitamitra_20260914_180000.dump
```

### Step 3: Verify Data Integrity
```bash
docker exec -it gitamitra-backend-1 python -c "
from app.core.database import SessionLocal
from app.models.user import User
from app.models.gita import GitaVerse

db = SessionLocal()
print('Users count:', db.query(User).count())
print('Verses count:', db.query(GitaVerse).count())
"
```

---

## 4. Backup Retention Policy
- Daily dumps: Retained for 30 days.
- Weekly snapshots: Retained for 12 weeks.
- Monthly archives: Retained for 12 months.
