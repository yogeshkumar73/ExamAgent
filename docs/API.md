# API Specification (REST / Postman Friendly)

All endpoints conform to the **SkillArena AI Full Project Plan & Technical Blueprint (Section 13)**.

### Authentication & Multi-User
- `POST /api/v1/auth/register` — User signup (`username`, `email`, `password`)
- `POST /api/v1/auth/login` — User authentication returning JWT bearer token
- `GET /api/v1/auth/me` — Authenticated profile (requires `Authorization: Bearer <token>`)
- `POST /api/v1/auth/anonymous` — Issues guest token or anonymous identifier

### Content Analyzer
- `POST /api/v1/content/analyze` — Analyzes submitted text, generates chunks & topic taxonomy
- `POST /api/v1/content/upload` — Multi-part upload for PDF, DOCX, TXT (up to 10 MB)
- `GET /api/v1/content/{content_id}/topics` — Returns detected topics from uploaded content

### Questions
- `POST /api/v1/questions/generate` — Generates grounded questions (MCQ, descriptive, scenario, technical)
- `GET /api/v1/questions/{question_id}` — Retrieves question details and reference rubric

### Practice Sessions & Evaluation
- `POST /api/v1/sessions/start` — Initializes a practice session
- `POST /api/v1/sessions/{session_id}/submit` — Submits candidate answer for AI rubric grading & awards XP
- `GET /api/v1/sessions/{session_id}/result` — Returns finished session scorecard and attempt history

### Analytics & Adaptive ML
- `GET /api/v1/analytics/session/{session_id}` — Session statistical features
- `GET /api/v1/analytics/{identifier}/summary` — Full user mastery summary
- `GET /api/v1/analytics/{identifier}/weak-topics` — Identifies low-scoring topics and missing concepts
- `GET /api/v1/analytics/{identifier}/recommendations` — Personalized adaptive study plan

### Gamification & Quests
- `GET /api/v1/gamification/{identifier}` — Learner XP, level, rank, badges, streak
- `GET /api/v1/gamification/quests` — Today's daily quest checklist
- `POST /api/v1/gamification/quests/{quest_id}/claim` — Claim quest XP idempotently
- `GET /api/v1/leaderboard/daily` — Daily leaderboard

### Progress Management
- `POST /api/v1/progress/export` — Export user records
- `POST /api/v1/progress/import` — Import user records
- `DELETE /api/v1/progress/{identifier}` — Reset or delete progress data
