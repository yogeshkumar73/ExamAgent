# MongoDB Database Schema (Section 12)

| Collection | Key Fields | Purpose |
|---|---|---|
| `users` | `_id`, `username`, `email`, `hashed_password`, `role`, `created_at` | Multi-user credentials and profiles |
| `content` | `_id`, `session_id`, `title`, `content_hash`, `topics[]`, `created_at` | Document context metadata |
| `content_chunks` | `_id`, `content_id`, `chunk_id`, `text`, `topic`, `hash` | Chunked text pieces for prompt grounding |
| `questions` | `_id`, `content_id`, `topic`, `question`, `difficulty`, `type`, `reference_answer`, `rubric` | Question bank |
| `practice_sessions` | `_id`, `anonymous_id`, `content_id`, `total_questions`, `completed_questions`, `accuracy`, `total_xp`, `status`, `created_at` | Session lifecycle tracking |
| `answer_attempts` | `_id`, `session_id`, `question_id`, `user_answer`, `score`, `missing_concepts[]`, `confidence`, `response_time_ms`, `created_at` | Candidate answers & rubric scores |
| `gamification` | `_id`, `anonymous_id`, `xp`, `level`, `streak`, `badges[]`, `completed_quests[]`, `updated_at` | XP, ranks, and unlocked achievements |
| `topic_mastery` | `_id`, `anonymous_id`, `topic`, `mastery_estimate`, `attempts`, `accuracy`, `updated_at` | Bayesian Knowledge Tracing scores |
| `daily_quests` | `quest_id`, `quest_definition`, `reward_xp` | Configurable daily quest pool |
| `leaderboard_entries`| `rank`, `anonymous_alias`, `points`, `badge_count`, `level` | Cached leaderboard records |

## Indexes
- `practice_sessions`: compound `(anonymous_id, created_at)`
- `answer_attempts`: compound `(session_id, question_id)`
- `gamification`: unique `(anonymous_id)`
- `users`: unique `(username)`, unique `(email)`
- `content`: unique `(content_hash)`
