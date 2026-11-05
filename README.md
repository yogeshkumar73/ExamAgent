# SkillArena AI — Full Production Backend & Multi-User Platform

SkillArena AI is an enterprise-grade AI interview preparation, adaptive learning, and gamification platform built according to the **SkillArena AI Full Project Plan & Technical Blueprint**.

---

## 🏛 Architecture & Technology Stack

- **Backend**: Python 3.11 + FastAPI (Modular Monolith)
- **Validation**: Pydantic v2
- **Data Analysis & ML**: Pandas, NumPy, Scikit-learn, Bayesian Knowledge Tracing (BKT), Exponential Moving Average (EMA)
- **Database**: MongoDB (10 collections with compound indexes) + Resilient In-Memory Fallback
- **Cache & Throttling**: Redis (Cache-aside with TTLs, distributed locks, sliding window rate limits) + In-Memory Fallback
- **AI Providers**: Google Gemini API (v1beta & SDK) + 5-Part Deterministic Rubric Evaluator
- **Security & Multi-User**:
  - JWT Access Tokens & Salted Password Hashing
  - Dual Mode: Full Multi-User Authentication + Seamless Anonymous Guest Mode (`x-anonymous-id`)
  - Sliding Window Rate Limiting (60 req/min)
  - 10MB Document Upload Limit (PDF, DOCX, TXT)
  - Idempotent Quest XP Rewards to prevent duplicate claims
  - CORS Whitelist Configuration
- **Frontend / Client**: React 19 + TypeScript + Vite + Tailwind CSS + Recharts + Motion (Framer Motion)

---

## 📂 Exact Industry Directory Structure

```text
skillarena-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application, CORS, rate-limiting & lifespan
│   │   ├── config.py                   # Pydantic Settings & environment variables
│   │   ├── core/
│   │   │   ├── security.py             # JWT issuance, password verification, Auth dependencies
│   │   │   ├── exceptions.py           # Custom HTTP exceptions
│   │   │   └── logging.py              # Structured logging configuration
│   │   ├── api/v1/                     # REST API Version 1 Routers
│   │   │   ├── auth.py                 # Multi-user register, login, me, anonymous token
│   │   │   ├── content.py              # Upload PDF/DOCX, analyze text, get topics
│   │   │   ├── questions.py            # Question generation, details, hints
│   │   │   ├── sessions.py             # Start sessions, submit answers, session scorecards
│   │   │   ├── analytics.py            # Summary, weak topics, personalized recommendations
│   │   │   ├── gamification.py         # Profile, XP, levels, daily quests, claim reward
│   │   │   ├── leaderboard.py          # Daily leaderboard rankings
│   │   │   ├── progress.py             # Backup export/import & delete data
│   │   │   └── interviewer.py          # Bridge endpoints for AI interviewer
│   │   ├── services/                   # Business logic services
│   │   │   ├── auth_service.py
│   │   │   ├── content_service.py
│   │   │   ├── topic_service.py
│   │   │   ├── question_service.py
│   │   │   ├── evaluation_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── adaptive_service.py
│   │   │   └── gamification_service.py
│   │   ├── ai/                         # AI provider and rubric evaluator
│   │   │   ├── provider.py             # Google Gemini client & HTTP fallback
│   │   │   ├── prompt_builder.py       # Grounded prompts (Section 16)
│   │   │   ├── evaluator.py            # 5-part rubric assessment engine
│   │   │   ├── generator.py            # Multi-format question generator
│   │   │   └── output_validator.py     # JSON recovery and sanitization
│   │   ├── ml/                         # Adaptive learning and statistics
│   │   │   ├── feature_engineering.py  # Pandas/NumPy statistics
│   │   │   ├── mastery_model.py        # Bayesian Knowledge Tracing & EMA
│   │   │   ├── difficulty_model.py     # Adaptive difficulty ladder (Easy-Expert)
│   │   │   └── recommendation_model.py # Weak topic and study plan builder
│   │   ├── cache/                      # Redis caching & rate limiting
│   │   │   ├── redis_client.py         # Connection manager with in-memory fallback
│   │   │   └── cache_service.py        # Cache keys, TTLs, distributed lock
│   │   ├── database/                   # MongoDB persistence
│   │   │   ├── mongodb.py              # Motor client with in-memory document fallback
│   │   │   └── repositories/           # Repositories for 10 collections
│   │   ├── schemas/                    # Pydantic typed request & response models
│   │   └── utils/
│   │       └── hashing.py              # Content hashing & cache key normalizer
│   ├── tests/                          # Automated Pytest suite (100% pass)
│   ├── requirements.txt
│   └── Dockerfile
├── infrastructure/
│   ├── docker-compose.yml              # Multi-container orchestration (FastAPI + Mongo + Redis)
│   └── redis.conf                      # Redis production memory & eviction policies
├── docs/
│   ├── HLD.md                          # High-Level Architecture & Mermaid diagram
│   ├── LLD.md                          # Low-Level Module Design & BKT equations
│   ├── API.md                          # Complete REST endpoint documentation
│   └── DATABASE.md                     # MongoDB 10 collections & index design
├── src/
│   ├── services/
│   │   └── api.ts                      # Frontend API client with JWT and guest tokens
│   └── ...                             # React frontend components
├── package.json
└── vite.config.ts
```

---

## 🚀 Quickstart Guide

### 1. Run the Backend (FastAPI)

```bash
# Option A: Direct uvicorn
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload

# Option B: Run via npm script
npm run backend
```

Open your browser to test the interactive Swagger documentation:
👉 **http://localhost:8000/docs**

### 2. Run Tests

```bash
python -m pytest backend/tests -v
# or
npm run backend:test
```

### 3. Run the Frontend (React + Vite)

```bash
npm run frontend
# or
npm run dev
```

Vite proxies all `/api` requests to `http://127.0.0.1:8000`.

### 4. Deploy with Docker Compose

```bash
cd infrastructure
docker-compose up --build -d
```
