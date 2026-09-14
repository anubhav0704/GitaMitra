# GitaMitra Production Architecture Document

## 1. End-to-End System Topology

```
[ User Browser / Client Mobile ]
       │
       │ HTTPS / WSS / SSE
       ▼
[ Nginx Reverse Proxy / Load Balancer ]
       │
       ├──────────────────────────────────────────┐
       │ (Static Assets / Server Components)     │ (REST / SSE API / WebSockets)
       ▼                                          ▼
[ Next.js 16 Production Frontend ]      [ FastAPI Production Backend Container ]
 (TypeScript, Tailwind, React 19)        ├── Request Tracing & Rate Limiters
                                          ├── Security Headers & Sanitizer
                                          ├── Auth & JWT Cookie Manager
                                          ├── Spiritual Dialogue Engine
                                          │    ├── Memory Retrieval Engine
                                          │    ├── Emotion & Context Analyzer
                                          │    ├── Hybrid Gita RAG Engine
                                          │    ├── Prompt Builder & Safety Guard
                                          │    └── LLM Streaming Pipeline
                                          ├── Voice Engine (Whisper STT / Edge TTS)
                                          ├── Account Privacy & Data Exporter
                                          └── RBAC System & Admin Controller
                                                        │
                                    ┌───────────────────┴───────────────────┐
                                    ▼                                       ▼
                       [ PostgreSQL 15 + pgvector ]              [ AI Provider APIs ]
                        ├── Relational Data                       ├── OpenAI / Groq LLM
                        │   (Users, Convs, Msgs,                 ├── Whisper STT
                        │    Memories, Feedback,                 └── Edge / OpenAI TTS
                        │    Audit Logs)
                        └── 384-d Dense Embeddings
                            (700 Gita Verses)
```

---

## 2. Security Boundaries & Data Isolation
- **Authentication**: JWT stored in `HttpOnly`, `SameSite=Lax` cookies.
- **Authorization**: User-scoped queries (`user_id == current_user.id`) across Conversations, Messages, Memories, and Voice sessions.
- **RBAC**: Administrative endpoints (`/api/admin/*`) protected by `require_admin` dependency checking `UserRole.ADMIN`.
- **Network Isolation**: PostgreSQL vector database accessible only within private container network.

---

## 3. Storage & Persistence Layer
- **PostgreSQL 15**: Relational database managing user authentication, sessions, conversation histories, memories, feedback ratings, and admin audit logs.
- **pgvector**: Dense vector similarity search index (`IVFFlat` / HNSW index) matching embeddings on 384 dimensions.
