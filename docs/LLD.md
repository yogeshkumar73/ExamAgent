# Low-Level Design (LLD) — SkillArena AI

## 1. Modular Services Breakdown

| Service Module | File Path | Responsibilities |
|---|---|---|
| `auth_service` | `app/services/auth_service.py` | Registration, credential validation, JWT token issuance, multi-user identity |
| `content_service` | `app/services/content_service.py` | PDF/DOCX safe parsing, text chunking, SHA-256 content hashing, topic detection |
| `topic_service` | `app/services/topic_service.py` | Topic hierarchy, concept prerequisite resolution |
| `question_service` | `app/services/question_service.py` | Question generation orchestration, Redis caching (`questions:{hash}`), duplicate checks |
| `evaluation_service`| `app/services/evaluation_service.py`| 5-part rubric scoring, feedback synthesis, BKT mastery update, idempotent XP reward |
| `analytics_service` | `app/services/analytics_service.py` | Feature extraction (NumPy/Pandas), trajectory tracking, weak topic identification |
| `gamification_service`| `app/services/gamification_service.py`| XP calculation, level progression, badge unlocking, daily quests, leaderboard |
| `cache_service` | `app/cache/cache_service.py` | Redis client with in-memory TTL/LRU fallback, distributed locks, rate limit buckets |

## 2. 5-Part Rubric Evaluation Weights (Section 5)
1. **Conceptual Correctness**: 40%
2. **Key Concept Coverage**: 25%
3. **Explanation Quality**: 15%
4. **Practical Application**: 10%
5. **Clarity and Structure**: 10%

## 3. Bayesian Knowledge Tracing (BKT) Update Equation
$$\text{Posterior: } P(L_t \mid \text{Correct}) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$
$$\text{Transition: } P(L_{t+1}) = P(L_t \mid \text{Obs}) + (1 - P(L_t \mid \text{Obs})) \cdot P(T)$$
Parameters: $P(L_0) = 0.35$, $P(T) = 0.20$, $P(G) = 0.15$, $P(S) = 0.10$.
