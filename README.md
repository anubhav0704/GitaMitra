# GitaMitra

GitaMitra is a production-quality AI spiritual companion inspired by the teachings of the Shrimad Bhagavad Gita. Users can discuss their problems, emotions, career, relationships, and other life situations, and the AI guides them using verified Bhagavad Gita teachings in a compassionate and practical way.

## Architecture

This application is built with a clean, modular architecture:

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+
- **Database**: PostgreSQL with `pgvector` extension for future RAG capabilities
- **Infrastructure**: Docker & Docker Compose

## Project Structure
- `backend/`: FastAPI application (Python 3.11)
  - Fully isolated PostgreSQL + pgvector database
  - Secure JWT authentication using HttpOnly cookies
  - SQLAlchemy models for Users, Conversations, Memories, and Gita Verses
- `frontend/`: Next.js application (React 18, Turbopack)
  - React Context for global auth state
  - Protected routes and Auth-aware UI
- `docker-compose.yml`: Local orchestration

## Key Features (Steps 1 through 5)
- **Step 1: Multi-User Authentication**: Secure registration, login, logout, password hashing (bcrypt), JWT HttpOnly cookies, and strict data isolation.
- **Step 2: Database Infrastructure**: PostgreSQL with `pgvector` container, migrations, connection pooling, and health checks.
- **Step 3: Authentic Bhagavad Gita Knowledge Base**: 18 chapters, 700 canonical verses with Devanagari Sanskrit, IAST transliteration, English & Hindi translations, and thematic tags.
- **Step 4: Hybrid RAG Retrieval**: 384-dimensional dense vector embeddings, cosine distance search, keyword matching, and emotion context weighting (~59ms latency).
- **Step 5: Scripture-Grounded Conversational AI**:
  - Provider abstraction: OpenAI, Google Gemini, and intelligent local fallback synthesizer.
  - Server-Sent Events (SSE) token streaming via `POST /api/chat/stream`.
  - Strict response validator preventing scripture hallucination and enforcing authentic citations.
  - Dedicated ChatService and Conversation CRUD with multi-user isolation.
  - Full-featured chat interface with conversation sidebar, suggestions, and verified Shloka Cards.

## Environment Variables
Configured in `.env` (or `.env.example`):
- `POSTGRES_*`: Database credentials and connection info
- `JWT_SECRET`: Secret key for session security
- `LLM_PROVIDER`: Provider to use (`mock`, `openai`, `gemini`)
- `OPENAI_API_KEY`: API key for OpenAI
- `GEMINI_API_KEY`: API key for Google Gemini
- `LLM_MODEL`: Model identifier (e.g. `gpt-4o-mini`, `gemini-1.5-flash`)
- `LLM_TEMPERATURE`: Generation temperature (default: `0.3`)
- `CHAT_HISTORY_LIMIT`: Bounded conversation history messages (default: `6`)

### Folder Structure

```
gitamitra/
├── frontend/           # Next.js React application
├── backend/            # FastAPI Python application
│   ├── app/
│   │   ├── api/        # API endpoints and routers
│   │   ├── core/       # Configuration, database setup, dependencies
│   │   ├── models/     # SQLAlchemy database models
│   │   ├── schemas/    # Pydantic validation schemas (to be added)
│   │   ├── services/   # Business logic (to be added)
│   │   ├── ...         # Other directories for RAG, LLM, Memory, Voice
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml  # Local infrastructure orchestration
└── .env.example        # Environment variables template
```

### Database Structure

The initial database schema includes the following tables:
- `users`: Isolated user accounts.
- `conversations`: Chat sessions tied to specific users.
- `messages`: Individual messages within conversations.
- `memories`: Stored insights for long-term memory.
- `gita_verses`: Reference table for verses (including vector embeddings).
- `user_preferences`: User-specific settings.

## How to Run the Project

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start

1. **Clone the repository** (if you haven't already).
2. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```
3. **Start the application** using Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. **Access the application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health Check API: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Verification

Visit `http://localhost:3000` and click the "Check Backend Health" button. You should see a response showing both the API and Database status as "ok".
