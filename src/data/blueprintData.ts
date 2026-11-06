import {
  InterviewQuestion,
  TopicMasteryItem,
  SessionAttempt,
  DashboardWidgetConfig,
  DailyQuest,
  BadgeItem,
  SkillTreeNode,
  TrajectoryDataPoint,
  EvaluationFeedback,
  DifficultyLevel,
} from '../types/skillarena';

export const DEFAULT_DOCUMENT_CONTEXT = `Candidate Project & Architecture Source: SkillArena AI — Full Project Plan & Technical Blueprint
Role & Experience Focus: Senior Full-Stack & Applied AI Systems Engineer
Core Stack: React + TypeScript + Vite, Tailwind CSS, Motion, Python FastAPI, Pydantic, Pandas, NumPy, Scikit-learn (Bayesian Knowledge Tracing, Logistic Regression, Random Forest, EMA Mastery), MongoDB (10 durable collections), Redis (caching, rate limits, distributed locks, leaderboards).
Key Engineering Highlights:
1. Designed a modular monolith architecture separating Content Analyzer, Question Generator, Semantic Answer Evaluator, Adaptive ML Engine, and Idempotent Gamification Engine.
2. Engineered a 5-criterion weighted evaluation rubric: Conceptual Correctness (40%), Key Concept Coverage (25%), Explanation Quality (15%), Practical Application (10%), and Clarity & Structure (10%) with Pydantic validation and automatic repair retry.
3. Implemented multi-tier Redis caching with normalized content hashes, versioned prompt/rubric keys, and distributed Redis locks to eliminate duplicate concurrent LLM invocations.
4. Built an anonymous-first privacy architecture using IndexedDB local persistence, crypto.randomUUID() session tokens, and optional recovery codes without mandatory user login.
5. Designed adaptive question routing combining Rule-Based heuristics at cold start with Bayesian Knowledge Tracing (BKT) and Exponential Moving Average (EMA) mastery updates.`;

export const INITIAL_WIDGET_CONFIGS: DashboardWidgetConfig[] = [
  {
    id: 'knowledge-gaps',
    title: 'Knowledge Gaps (BKT Probability < 0.50)',
    description: 'Critical topics where Bayesian Knowledge Tracing P(Known) is below the 0.50 proficiency threshold, with one-click AI Interviewer remediation.',
    visible: true,
    span: 'full',
    order: 1,
  },
  {
    id: 'mastery-trajectory',
    title: 'Real-Time Mastery & Rubric Score Trajectory',
    description: 'Interactive multi-series area chart tracking rubric evaluation scores, BKT mastery probability, and session velocity.',
    visible: true,
    span: 'full',
    order: 2,
  },
  {
    id: 'topic-competency',
    title: 'Domain Competency & Bayesian Mastery Breakdown',
    description: 'Comparative bar visualization across Technical Architecture, Behavioral STAR, System Design, and ML topics.',
    visible: true,
    span: 'half',
    order: 3,
  },
  {
    id: 'rubric-radar',
    title: '5-Criterion Rubric Performance Distribution',
    description: 'Weighted performance across Conceptual (40%), Coverage (25%), Explanation (15%), Practical (10%), and Clarity (10%).',
    visible: true,
    span: 'half',
    order: 4,
  },
  {
    id: 'live-telemetry',
    title: 'Live Practice Stream & Redis Cache Efficiency',
    description: 'Real-time visualization of evaluation latency, cache hit ratios, and active session scoring telemetry.',
    visible: true,
    span: 'half',
    order: 5,
  },
  {
    id: 'weak-topic-actions',
    title: 'Adaptive ML Gap Diagnosis & Priority Drills',
    description: 'Actionable weak-topic queue ranked by Bayesian Knowledge Tracing slip rate and concept omissions.',
    visible: true,
    span: 'half',
    order: 6,
  },
  {
    id: 'recent-sessions',
    title: 'Recent AI Interview Evaluation Log',
    description: 'High-density tabular log of recent technical and behavioral responses with instant rubric drill-down.',
    visible: true,
    span: 'full',
    order: 7,
  },
];

export const INITIAL_TOPIC_MASTERY: TopicMasteryItem[] = [
  {
    id: 'topic-fastapi',
    topic: 'FastAPI & Pydantic Output Validation',
    category: 'Technical',
    masteryScore: 91,
    bktProbability: 0.92,
    emaTrend: 6.4,
    attempts: 14,
    avgScore: 89,
    avgResponseSec: 52,
    lastPracticed: '2 hours ago',
    status: 'Mastered',
    keyWeakness: 'Repair prompt fallback retry edge cases',
  },
  {
    id: 'topic-redis',
    topic: 'Redis Caching, TTL Keys & Distributed Locks',
    category: 'System Design',
    masteryScore: 86,
    bktProbability: 0.87,
    emaTrend: 8.2,
    attempts: 11,
    avgScore: 85,
    avgResponseSec: 64,
    lastPracticed: 'Yesterday',
    status: 'Proficient',
    keyWeakness: 'Semantic cache invalidation on rubric version bump',
  },
  {
    id: 'topic-bkt',
    topic: 'Bayesian Knowledge Tracing & Adaptive ML',
    category: 'Adaptive ML',
    masteryScore: 46,
    bktProbability: 0.46,
    emaTrend: -2.4,
    attempts: 5,
    avgScore: 48,
    avgResponseSec: 86,
    lastPracticed: '2 days ago',
    status: 'Needs Focus',
    keyWeakness: 'Cold-start transition from rule-based engine to BKT P(Known) updates',
  },
  {
    id: 'topic-mongodb',
    topic: 'MongoDB Schema & TTL Index Retention',
    category: 'System Design',
    masteryScore: 83,
    bktProbability: 0.84,
    emaTrend: 5.0,
    attempts: 10,
    avgScore: 82,
    avgResponseSec: 58,
    lastPracticed: '2 days ago',
    status: 'Proficient',
    keyWeakness: 'Compound index ordering for anonymous_id queries',
  },
  {
    id: 'topic-behavioral-arch',
    topic: 'Architectural Trade-Offs (Modular Monolith vs Microservices)',
    category: 'Behavioral',
    masteryScore: 88,
    bktProbability: 0.89,
    emaTrend: 7.5,
    attempts: 8,
    avgScore: 88,
    avgResponseSec: 69,
    lastPracticed: 'Today',
    status: 'Proficient',
    keyWeakness: 'Quantifying operational cost savings in STAR result',
  },
  {
    id: 'topic-behavioral-conflict',
    topic: 'Handling Ambiguous AI Grading & User Trust (STAR)',
    category: 'Behavioral',
    masteryScore: 42,
    bktProbability: 0.42,
    emaTrend: -3.1,
    attempts: 4,
    avgScore: 44,
    avgResponseSec: 92,
    lastPracticed: '3 days ago',
    status: 'Needs Focus',
    keyWeakness: 'Structuring measurable user retention impact & zero-penalty XP logic',
  },
  {
    id: 'topic-security',
    topic: 'Prompt Injection Defense & Anonymous Privacy',
    category: 'Technical',
    masteryScore: 38,
    bktProbability: 0.38,
    emaTrend: -4.2,
    attempts: 3,
    avgScore: 41,
    avgResponseSec: 95,
    lastPracticed: '4 days ago',
    status: 'Needs Focus',
    keyWeakness: 'Untrusted source text delimiter sandboxing & anonymous session validation',
  },
];

export const INITIAL_TRAJECTORY_DATA: TrajectoryDataPoint[] = [
  { sessionLabel: 'S-01', date: 'Oct 24', overallScore: 66, bktMastery: 62, technicalScore: 68, behavioralScore: 64, responseTimeSec: 88, xpEarned: 120 },
  { sessionLabel: 'S-02', date: 'Oct 26', overallScore: 71, bktMastery: 66, technicalScore: 74, behavioralScore: 68, responseTimeSec: 82, xpEarned: 165 },
  { sessionLabel: 'S-03', date: 'Oct 28', overallScore: 74, bktMastery: 70, technicalScore: 77, behavioralScore: 71, responseTimeSec: 76, xpEarned: 190 },
  { sessionLabel: 'S-04', date: 'Oct 30', overallScore: 72, bktMastery: 72, technicalScore: 70, behavioralScore: 75, responseTimeSec: 79, xpEarned: 150 },
  { sessionLabel: 'S-05', date: 'Nov 01', overallScore: 79, bktMastery: 76, technicalScore: 82, behavioralScore: 76, responseTimeSec: 68, xpEarned: 230 },
  { sessionLabel: 'S-06', date: 'Nov 02', overallScore: 83, bktMastery: 80, technicalScore: 85, behavioralScore: 81, responseTimeSec: 64, xpEarned: 260 },
  { sessionLabel: 'S-07', date: 'Nov 03', overallScore: 86, bktMastery: 83, technicalScore: 88, behavioralScore: 84, responseTimeSec: 59, xpEarned: 295 },
  { sessionLabel: 'S-08', date: 'Nov 05', overallScore: 89, bktMastery: 86, technicalScore: 91, behavioralScore: 87, responseTimeSec: 54, xpEarned: 340 },
];

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q-redis-cache-keys',
    title: 'Multi-Tier Redis Caching & Semantic Evaluation Safety',
    question:
      'In the SkillArena AI architecture, you cache both generated questions and answer evaluations in Redis. Walk through how you design the Redis cache keys, TTL policies, and distributed locking strategy, and explain why broad semantic cache reuse for answer evaluations can be dangerous.',
    category: 'System Design',
    topic: 'Redis Caching, TTL Keys & Distributed Locks',
    difficulty: 'Hard',
    blueprintSection: 'Section 8: Redis Caching and Optimization',
    expectedDurationSec: 120,
    hint: 'Consider content normalization before hashing, including model/prompt/rubric versions in the key, TTL differences (24h vs 1h), and why two slightly different answers should not share an evaluation cache hit.',
    referenceAnswer:
      'We normalize input content before computing a deterministic SHA-256 content_hash. For topic analysis we use topic_analysis:{content_hash} (24h TTL) and for question generation questions:{content_hash}:{config_hash} (12h TTL). For answer evaluation, the key is evaluation:{question_hash}:{answer_hash}:{rubric_version} with a strict 1-hour TTL, including model, prompt, and rubric versions so rubric updates immediately invalidate stale scores. We acquire short-lived Redis locks (SET NX PX) per request signature to prevent thundering-herd duplicate concurrent AI calls. Crucially, we only cache exact normalized answer hashes rather than broad vector similarity matches because subtle wording changes (such as negations or missing edge-case caveats) drastically alter conceptual correctness, and sharing personalized evaluations across users risks leaking context or transferring inaccurate grades.',
    rubricConcepts: [
      'Content normalization & deterministic hashing',
      'Versioned cache keys (model, prompt, rubric_version)',
      'Distributed Redis locks to prevent duplicate concurrent LLM calls',
      'Exact answer hash vs semantic cache false-positive risk',
      'Explicit TTL hierarchy (24h topic, 12h questions, 1h evaluation)',
    ],
    sampleStrongAnswer:
      'In SkillArena AI, our cache flow checks Redis before invoking the AI provider. First, we normalize text whitespace and casing before hashing. We structure keys by domain: topic_analysis:{content_hash} with a 24h TTL, questions:{content_hash}:{config_hash} with a 12h TTL, and evaluation:{question_hash}:{answer_hash}:{rubric_version} with a 1h TTL. Including the prompt, model, and rubric version inside the key prevents stale grading when rubrics evolve. To prevent duplicate concurrent AI calls when a user double-submits or multiple workers process the same hash, we use Redis locks. Finally, we avoid broad semantic similarity caching for answer evaluations because minor phrasing differences can flip conceptual correctness from accurate to flawed; we only reuse exact normalized answer evaluations that are user-independent.',
    samplePartialAnswer:
      'We use Redis to cache questions for 12 hours and evaluations for 1 hour using hashes of the question and answer. This saves AI costs and keeps response times under 100ms. We also rate limit users to 1 minute windows using Redis.',
  },
  {
    id: 'q-behavioral-monolith',
    title: 'Behavioral (STAR): Defending a Modular Monolith Over Microservices',
    question:
      'Tell me about a time you had to make a high-stakes architectural decision between a complex distributed system and a simpler pragmatic design. Using your SkillArena AI experience, why did you choose a modular monolith for the MVP, and how did you structure it so future scaling wouldn’t require a rewrite?',
    category: 'Behavioral',
    topic: 'Architectural Trade-Offs (Modular Monolith vs Microservices)',
    difficulty: 'Medium',
    blueprintSection: 'Section 4 & 10: Functional Modules & High-Level Design',
    expectedDurationSec: 150,
    hint: 'Structure your response using STAR (Situation, Task, Action, Result). Mention the 10 distinct domain services in app/services/ and how clean interfaces allow extracting background workers later.',
    referenceAnswer:
      'Situation: While architecting SkillArena AI, we needed to orchestrate content extraction, question generation, semantic rubric grading, Bayesian Knowledge Tracing analytics, and idempotent XP gamification within an 8-week MVP timeline. Task: Decide between splitting these 7 functional modules into separate microservices with message brokers or building a unified backend without sacrificing long-term scalability. Action: I advocated for a modular monolith in Python FastAPI. I enforced strict domain boundaries inside app/services/ (content_service, question_service, evaluation_service, adaptive_service, gamification_service) backed by Pydantic contracts and a repository layer for MongoDB and Redis. Heavy asynchronous jobs were isolated behind a clean worker interface so an optional background worker process could be spun up without changing business logic. Result: We eliminated network serialization overhead, kept non-AI API p95 latency under 300ms, simplified end-to-end integration testing, and preserved the ability to extract the AI evaluator or ML service independently once traffic scale justified it.',
    rubricConcepts: [
      'STAR Framework (Situation, Task, Action, Result)',
      'Modular monolith domain boundaries (app/services separation)',
      'Avoiding premature microservice operational & network overhead',
      'Clean Pydantic contracts & optional background worker seam',
      'Measurable latency (<300ms p95) and 8-week delivery velocity',
    ],
    sampleStrongAnswer:
      'Situation: When designing SkillArena AI, the system required 7 core modules including PDF content analysis, AI question generation, rubric grading, Bayesian mastery analytics, and gamification on an 8-week roadmap. Task: I needed to define an architecture that was fast to ship and test while supporting future high concurrency. Action: Instead of premature microservices, I architected a modular monolith in FastAPI. Each domain—content_service, evaluation_service, adaptive_service, gamification_service—communicated via strict Pydantic models and isolated repository layers for MongoDB and Redis, with an optional background worker for heavy parsing. Result: This cut deployment complexity to a single container initially, achieved <300ms p95 non-AI latency, and allowed us to scale the worker process independently later without refactoring core services.',
    samplePartialAnswer:
      'For SkillArena AI, I chose a monolith in FastAPI instead of microservices because microservices take too long to set up for one developer. We put all the files in a services folder so it stays organized and we can split them later if we get more users.',
  },
  {
    id: 'q-rubric-validation',
    title: 'LLM Output Validation, Rubric Weighting & Hallucination Guardrails',
    question:
      'Explain how your Answer Evaluation Agent grades descriptive and coding responses reliably. How do you enforce the weighted rubric, handle ambiguous source documents, and recover when the LLM returns malformed JSON?',
    category: 'Technical',
    topic: 'FastAPI & Pydantic Output Validation',
    difficulty: 'Hard',
    blueprintSection: 'Section 5 & 16: Answer Evaluation, Rating & AI Prompt Blueprint',
    expectedDurationSec: 120,
    hint: 'Reference the 40/25/15/10/10 rubric weights, disclosing uncertainty when source text is insufficient, Pydantic schema validation, and the single retry with a repair prompt.',
    referenceAnswer:
      'The Answer Evaluation Agent grades responses against four inputs: the question, grounded source content chunks, reference answer, and explicit weighted rubric. For descriptive questions, weights are Conceptual Correctness (40%), Key Concept Coverage (25%), Explanation Quality (15%), Practical Application (10%), and Clarity/Structure (10%). For coding questions, we prioritize deterministic code execution and unit tests alongside rubric weights (Output correctness 40%, Algorithmic logic 25%, Edge cases 15%, Complexity 10%, Code quality 10%). To prevent hallucinations, system rules mandate assessing semantic meaning rather than exact wording, never inventing unsupported facts, and explicitly disclosing uncertainty with a lower confidence score if the source text is ambiguous. Every LLM response is validated through a strict Pydantic EvaluationResult schema; if malformed, the service retries once with a targeted repair prompt before returning a safe fallback error, while logging prompt, model, and rubric versions for auditing.',
    rubricConcepts: [
      'Weighted 5-part rubric (40/25/15/10/10 descriptive & coding)',
      'Semantic meaning evaluation grounded in source content',
      'Explicit uncertainty disclosure when source evidence is ambiguous',
      'Pydantic structured validation with 1x repair prompt retry',
      'Audit versioning of model, prompt, and rubric',
    ],
    sampleStrongAnswer:
      'Our evaluation service combines source grounding with strict schema enforcement. We apply a 100-point weighted rubric: 40% conceptual correctness, 25% key concept coverage, 15% explanation quality, 10% practical application, and 10% clarity and structure (and for code, we prefer deterministic test execution alongside logic and complexity grading). Our prompt blueprint instructs the model to grade semantic meaning rather than verbatim wording, never reward filler, and explicitly disclose uncertainty if the user-uploaded source document is ambiguous rather than hallucinating facts. On the backend, we validate the JSON output with Pydantic. If validation fails, we execute a single retry using a repair prompt, and if that fails, return a safe structured error while persisting model_version and prompt_version for auditability.',
    samplePartialAnswer:
      'We ask the AI to return JSON with a score from 0 to 100 and a rating like Excellent or Good. We check Conceptual Correctness for 40% and Concept Coverage for 25%. If the JSON is broken, we catch the error in Python and retry.',
  },
  {
    id: 'q-adaptive-bkt',
    title: 'Cold-Start Adaptive Learning & Bayesian Knowledge Tracing (BKT)',
    question:
      'How does SkillArena AI transition from cold-start practice to personalized adaptive question selection? Explain why Pandas and NumPy are used alongside rule-based engines and Bayesian Knowledge Tracing rather than training deep ML models from day one.',
    category: 'Adaptive ML',
    topic: 'Bayesian Knowledge Tracing & Adaptive ML',
    difficulty: 'Expert',
    blueprintSection: 'Section 3 & 6: Machine Learning and Adaptive Analytics',
    expectedDurationSec: 135,
    hint: 'Discuss cold-start data scarcity, transparent rule-based routing first, BKT + Exponential Moving Average (EMA) mastery updates, and engineered features like response time, hint usage, and confidence vs correctness.',
    referenceAnswer:
      'At launch, training complex ML models from scratch without reliable, consented, human-validated data leads to brittle and unexplainable recommendations. Therefore, SkillArena AI begins with a transparent rule-based adaptive engine coupled with Exponential Moving Average (EMA) and Bayesian Knowledge Tracing (BKT) to estimate per-topic concept mastery across attempts. We use Pandas and NumPy for deterministic feature engineering and descriptive statistics—computing per-topic accuracy, response time trends, attempt counts, repeated concept omissions, hint usage, and learner confidence vs. actual correctness. As consented, anonymized interaction data matures and is validated against held-out human-graded benchmarks, we layer in Logistic Regression for next-question correctness probability and Random Forests for weak-topic classification, ensuring every recommendation remains explainable to the learner.',
    rubricConcepts: [
      'Cold-start strategy: rule-based engine + EMA/BKT before custom ML training',
      'Feature engineering with Pandas/NumPy (accuracy, response time, hint usage)',
      'Bayesian Knowledge Tracing (BKT) concept mastery estimation',
      'Logistic Regression & Random Forest roles once validated data exists',
      'Explainability and validation against human-graded held-out sets',
    ],
    sampleStrongAnswer:
      'Pandas and NumPy are data analysis and feature engineering libraries, not AI models themselves. In SkillArena AI, we avoid training scratch ML models at launch because cold-start data is sparse and unvalidated. Instead, we start with a transparent rule-based adaptive engine combined with Bayesian Knowledge Tracing (BKT) and Exponential Moving Averages (EMA) to update topic mastery after every attempt. Using Pandas and NumPy, we engineer features including per-topic accuracy, response_time_ms, hint usage, repeated missing_concepts, and score trends. Once we collect sufficient consented, anonymized data validated against human-graded held-out sets, we use Logistic Regression to predict P(correct response) and Random Forest to classify weak-topic priority, keeping all learning recommendations explainable.',
    samplePartialAnswer:
      'We use Pandas and NumPy to calculate average scores and weak topics, and Scikit-learn with Bayesian Knowledge Tracing to predict what question to show next based on whether the user got the last question right or wrong.',
  },
  {
    id: 'q-behavioral-trust',
    title: 'Behavioral (STAR): Designing Fair Gamification & Handling Imperfect AI Grading',
    question:
      'AI grading is inherently probabilistic and occasionally imperfect. Tell me how you designed the user experience, feedback loop, and XP reward mechanics in SkillArena AI so that learners stay motivated and never feel unfairly penalized by an AI evaluation.',
    category: 'Behavioral',
    topic: 'Handling Ambiguous AI Grading & User Trust (STAR)',
    difficulty: 'Medium',
    blueprintSection: 'Section 5, 7 & 22: Gamification & Product Vision',
    expectedDurationSec: 120,
    hint: 'Highlight the zero-XP-deduction policy, awarding partial learning XP for reviewing feedback and answering corrective follow-ups, transparent rubric criteria, and server-side idempotent reward claims.',
    referenceAnswer:
      'Situation: In AI-assisted learning platforms, candidates quickly lose trust and motivation if an LLM misunderstands a valid phrasing or deducts points arbitrarily. Task: Design an assessment and gamification loop in SkillArena AI that maintains high academic rigor while keeping learners psychologically engaged and treated fairly. Action: First, I made grading transparent by breaking every score into 5 visible rubric criteria and listing exact matched and missing concepts grounded in the source text. Second, I established a strict "No XP Deduction" rule for incorrect answers—instead of punishing errors, learners earn partial learning XP for reviewing detailed feedback and +40 XP for completing revision challenges on weak topics. Third, all XP and quest rewards are computed server-side using idempotency keys to keep leaderboards fair. Result: Learners treat low scores as actionable diagnostic roadmaps rather than unfair penalties, driving higher revision completion and measurable score improvements across repeated sessions.',
    rubricConcepts: [
      'STAR structure with clear user-empathy problem framing',
      'Zero XP deduction policy for incorrect answers',
      'Partial learning XP for feedback review & corrective follow-ups',
      'Transparent 5-part rubric & source-grounded missing concepts',
      'Server-side idempotent XP calculation for fairness',
    ],
    sampleStrongAnswer:
      'Situation: When building SkillArena AI, we recognized that LLM grading is never 100% perfect, and harsh or opaque scoring causes interview anxiety and drop-off. Task: I needed to design a feedback and gamification engine that builds confidence while accurately exposing knowledge gaps. Action: I implemented three core safeguards: first, transparent 5-criterion rubric breakdowns grounded in the user’s source notes so grades never feel arbitrary; second, a strict policy to never deduct XP for wrong answers, instead awarding partial learning XP when a candidate reviews feedback and answers a corrective follow-up (+40 XP for revision challenges, +75 XP for weak-topic improvement); and third, server-side idempotent reward claims. Result: This turned mistakes into a rewarding revision loop and ensured 100% deterministic, fair gamification logic.',
    samplePartialAnswer:
      'To keep users motivated, we never subtract XP when they get an answer wrong. We show them the correct answer and suggestions so they can learn from it, and give them badges like Comeback Hero when they improve their score by 20%.',
  },
  {
    id: 'q-security-privacy',
    title: 'Anonymous-First Architecture, IndexedDB Persistence & Prompt Injection Defense',
    question:
      'SkillArena AI requires zero mandatory login while still supporting cross-session progress, PDF uploads, and leaderboards. How do you architect anonymous session security, browser persistence, and defense against prompt injection in uploaded documents?',
    category: 'Technical',
    topic: 'Prompt Injection Defense & Anonymous Privacy',
    difficulty: 'Hard',
    blueprintSection: 'Section 9 & 17: Anonymous Access, Persistence, Security & Performance',
    expectedDurationSec: 130,
    hint: 'Explain crypto.randomUUID() in localStorage + IndexedDB progress, why anonymous_id is NOT authentication, MIME/10MB file limits, delimiting untrusted source text, and Redis rate limiting.',
    referenceAnswer:
      'We generate a cryptographically random identifier via crypto.randomUUID() stored in localStorage and persist full session history locally in IndexedDB, paired with JSON export/import and an optional recovery token for cross-device continuity. Because an anonymous_id is not authentication, the backend validates session ownership tokens, enforces strict Redis rate limits (rate_limit:{anonymous_id} with 1-minute windows and per-session daily AI quotas), and uses TTL indexes in MongoDB for temporary records. For uploaded PDF/DOCX files, we enforce a 10MB size cap, strict MIME-type validation, and safe text extraction. Critically, all uploaded content and user answers are treated as untrusted input: we wrap source text in strict structural delimiters inside the prompt blueprint and instruct the system role to ignore embedded instructions, preventing indirect prompt injection from hijacking the rubric evaluator.',
    rubricConcepts: [
      'crypto.randomUUID() + IndexedDB local persistence with export/import',
      'Recognizing anonymous_id is not auth (session ownership + Redis rate limits)',
      'File safety: 10MB limit, MIME validation, safe text parsing',
      'Prompt injection defense: untrusted content delimiters & system role isolation',
      'Data minimization & MongoDB TTL retention controls',
    ],
    sampleStrongAnswer:
      'Our anonymous-first architecture generates a crypto.randomUUID() client identifier and stores detailed practice state in IndexedDB, giving users instant zero-login access plus JSON export/import and recovery tokens. On the backend, we explicitly treat anonymous_id as an unauthenticated handle: we validate session ownership, enforce Redis rate limiting (1-minute sliding windows and max 20 generated questions per request), and apply per-session token quotas. For file uploads, we enforce a 10MB cap and strict MIME validation. To defend against indirect prompt injection inside uploaded PDFs or candidate answers, we sanitize extracted text and enclose untrusted content within strict XML/structural delimiters so user text cannot override system grading instructions.',
    samplePartialAnswer:
      'We create a random UUID in the browser and save data in localStorage and IndexedDB. Users can export their data as a file. On the server we rate limit by anonymous_id in Redis and limit PDF uploads to 10MB.',
  },
];

export const INITIAL_SESSION_ATTEMPTS: SessionAttempt[] = [
  {
    id: 'att-101',
    questionId: 'q-fastapi-validation',
    questionTitle: 'LLM Output Validation, Rubric Weighting & Hallucination Guardrails',
    category: 'Technical',
    topic: 'FastAPI & Pydantic Output Validation',
    difficulty: 'Hard',
    userAnswer:
      'We enforce a 5-criterion rubric (40% conceptual, 25% coverage, 15% explanation, 10% practical, 10% clarity) and validate the JSON response using Pydantic EvaluationResult. If malformed, we retry once with a repair prompt and record prompt/model versions.',
    responseTimeSec: 54,
    timestamp: 'Today, 09:15 AM',
    feedback: {
      score: 91,
      rating: 'Excellent',
      criterionBreakdown: {
        conceptualCorrectness: 37,
        conceptCoverage: 23,
        explanationQuality: 13,
        practicalApplication: 9,
        clarityAndStructure: 9,
      },
      correctConcepts: [
        'Weighted 5-part rubric (40/25/15/10/10)',
        'Pydantic structured validation with 1x repair prompt retry',
        'Audit versioning of model, prompt, and rubric',
      ],
      missingConcepts: ['Deterministic code execution preference for coding questions'],
      correctedAnswer:
        'Include how coding evaluations combine deterministic unit test execution with the 40/25/15/10/10 coding rubric and explicitly disclose uncertainty when source text is ambiguous.',
      improvementSuggestions: [
        'Mention deterministic test execution for coding questions alongside semantic LLM grading.',
        'Note how confidence scores drop when source material has ambiguity.',
      ],
      followUpQuestion:
        'How would you design the repair prompt so it fixes JSON syntax errors without altering the substantive grade?',
      confidence: 0.95,
      xpEarned: 40,
      nextDifficulty: 'Expert',
      evaluatedBy: 'gemini-3.8-flash',
    },
  },
  {
    id: 'att-102',
    questionId: 'q-behavioral-monolith',
    questionTitle: 'Behavioral (STAR): Defending a Modular Monolith Over Microservices',
    category: 'Behavioral',
    topic: 'Architectural Trade-Offs (Modular Monolith vs Microservices)',
    difficulty: 'Medium',
    userAnswer:
      'Using STAR: For SkillArena AI (8-week MVP), I chose a modular monolith in FastAPI with separated service modules (content, question, evaluation, adaptive, gamification) and Pydantic interfaces, keeping non-AI p95 latency below 300ms while allowing background worker extraction.',
    responseTimeSec: 68,
    timestamp: 'Yesterday, 06:40 PM',
    feedback: {
      score: 88,
      rating: 'Good',
      criterionBreakdown: {
        conceptualCorrectness: 36,
        conceptCoverage: 22,
        explanationQuality: 13,
        practicalApplication: 8,
        clarityAndStructure: 9,
      },
      correctConcepts: [
        'STAR Framework (Situation, Task, Action, Result)',
        'Modular monolith domain boundaries',
        'Measurable latency (<300ms p95) and 8-week delivery velocity',
      ],
      missingConcepts: ['Criteria for when to split a module into an independent service'],
      correctedAnswer:
        'Strong STAR narrative. Expand briefly on the exact threshold (e.g., CPU-bound PDF parsing or ML inference queue depth) that triggers splitting the optional background worker into a separate deployment.',
      improvementSuggestions: [
        'State the concrete scaling trigger that justifies extracting the background worker process.',
      ],
      followUpQuestion:
        'How do you prevent circular imports and database table coupling between modules inside a single FastAPI codebase?',
      confidence: 0.93,
      xpEarned: 30,
      nextDifficulty: 'Hard',
      evaluatedBy: 'gemini-3.8-flash',
    },
  },
  {
    id: 'att-103',
    questionId: 'q-adaptive-bkt',
    questionTitle: 'Cold-Start Adaptive Learning & Bayesian Knowledge Tracing (BKT)',
    category: 'Adaptive ML',
    topic: 'Bayesian Knowledge Tracing & Adaptive ML',
    difficulty: 'Expert',
    userAnswer:
      'We start with a rule-based engine and Exponential Moving Average mastery because we do not have training data at launch. Later we use Bayesian Knowledge Tracing and Scikit-learn models with Pandas and NumPy features.',
    responseTimeSec: 79,
    timestamp: '2 days ago',
    feedback: {
      score: 74,
      rating: 'Needs Improvement',
      criterionBreakdown: {
        conceptualCorrectness: 30,
        conceptCoverage: 18,
        explanationQuality: 11,
        practicalApplication: 7,
        clarityAndStructure: 8,
      },
      correctConcepts: [
        'Cold-start strategy: rule-based engine + EMA/BKT before custom ML training',
        'Feature engineering with Pandas/NumPy',
      ],
      missingConcepts: [
        'Specific engineered features (response time, hint usage, confidence vs correctness)',
        'Validation with held-out human-graded datasets before production deployment',
      ],
      correctedAnswer:
        'Specify the exact feature vector engineered in Pandas/NumPy (per-topic accuracy, response time, attempt count, repeated mistakes, hint usage, and confidence vs correctness) and explain how Logistic Regression and Random Forest models are validated against human-graded held-out sets.',
      improvementSuggestions: [
        'Enumerate the 7 input features engineered with Pandas and NumPy.',
        'Explain how held-out human-graded examples validate model readiness.',
      ],
      followUpQuestion:
        'How does hint usage affect the Bayesian Knowledge Tracing mastery update step compared to an unassisted correct answer?',
      confidence: 0.91,
      xpEarned: 35,
      nextDifficulty: 'Hard',
      evaluatedBy: 'deterministic-rubric-engine',
    },
  },
];

export const INITIAL_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest-1',
    title: 'High-Precision Architect',
    description: 'Complete 2 Technical or System Design interview questions with a score of 80+.',
    progress: 2,
    target: 2,
    rewardXp: 100,
    claimed: false,
    category: 'Technical Mastery',
  },
  {
    id: 'quest-2',
    title: 'Weak-Topic Remediation',
    description: 'Practice a question in "Bayesian Knowledge Tracing" or "Behavioral Trust" to boost BKT mastery.',
    progress: 1,
    target: 2,
    rewardXp: 75,
    claimed: false,
    category: 'Adaptive ML',
  },
  {
    id: 'quest-3',
    title: 'STAR Storytelling Drill',
    description: 'Submit a Behavioral response covering Situation, Task, Action, and quantified Result.',
    progress: 1,
    target: 1,
    rewardXp: 50,
    claimed: false,
    category: 'Behavioral',
  },
];

export const INITIAL_BADGES: BadgeItem[] = [
  {
    id: 'badge-first-step',
    name: 'First Step',
    condition: 'Complete your first grounded AI interview session',
    unlocked: true,
    unlockedAt: 'Oct 24',
    progressText: '1 / 1 session',
  },
  {
    id: 'badge-quick-learner',
    name: 'Quick Learner',
    condition: 'Answer 10 Blueprint interview questions with Good or Excellent rating',
    unlocked: true,
    unlockedAt: 'Nov 01',
    progressText: '10 / 10 questions',
  },
  {
    id: 'badge-streak-master',
    name: 'Streak Master',
    condition: 'Practice for 7 consecutive days',
    unlocked: true,
    unlockedAt: 'Nov 04',
    progressText: '7 / 7 days',
  },
  {
    id: 'badge-topic-master',
    name: 'Topic Master',
    condition: 'Reach 90%+ BKT mastery in any architectural domain',
    unlocked: true,
    unlockedAt: 'Nov 05',
    progressText: '91% in FastAPI & Pydantic',
  },
  {
    id: 'badge-perfectionist',
    name: 'Perfectionist',
    condition: 'Achieve a 95+ rubric score on a Hard or Expert question',
    unlocked: false,
    progressText: 'Best: 91 / 95',
  },
  {
    id: 'badge-boss-slayer',
    name: 'Boss Slayer',
    condition: 'Complete 3 Expert-difficulty System Design & Adaptive ML challenges',
    unlocked: false,
    progressText: '1 / 3 Expert challenges',
  },
];

export const SKILL_TREE_NODES: SkillTreeNode[] = [
  {
    id: 'node-1',
    stage: 1,
    title: '01. Content Analyzer & Ingestion',
    subtitle: 'PDF/DOCX Extraction, Chunking & SHA-256 Hashing',
    mastery: 94,
    status: 'completed',
    topics: ['MIME Validation & 10MB Cap', 'Text Normalization', 'Topic & Concept Graph'],
    xpRequired: 200,
    linkedTopic: 'Prompt Injection Defense & Anonymous Privacy',
  },
  {
    id: 'node-2',
    stage: 2,
    title: '02. FastAPI & Pydantic Contracts',
    subtitle: 'Modular Monolith Services & Repair Retry Loop',
    mastery: 91,
    status: 'completed',
    topics: ['18 REST Endpoints', 'Pydantic Structured Output', '1x Repair Prompt Fallback'],
    xpRequired: 500,
    linkedTopic: 'FastAPI & Pydantic Output Validation',
  },
  {
    id: 'node-3',
    stage: 3,
    title: '03. Redis Caching & MongoDB Persistence',
    subtitle: 'Versioned Keys, Distributed Locks & 10 Collections',
    mastery: 86,
    status: 'active',
    topics: ['Versioned Evaluation Cache (1h)', 'Redis Lock Thundering-Herd', 'MongoDB TTL Indexes'],
    xpRequired: 900,
    linkedTopic: 'Redis Caching, TTL Keys & Distributed Locks',
  },
  {
    id: 'node-4',
    stage: 4,
    title: '04. Bayesian Knowledge Tracing & ML',
    subtitle: 'Cold-Start Rules, EMA Updates & Scikit-Learn Classifiers',
    mastery: 74,
    status: 'unlocked',
    topics: ['Pandas/NumPy Feature Vector', 'BKT Mastery Estimation', 'Logistic Regression & RF'],
    xpRequired: 1300,
    linkedTopic: 'Bayesian Knowledge Tracing & Adaptive ML',
  },
  {
    id: 'node-5',
    stage: 5,
    title: '05. Staff Behavioral & Architecture Defense',
    subtitle: 'STAR Storytelling, Trade-Offs & User Trust Loops',
    mastery: 78,
    status: 'unlocked',
    topics: ['Modular Monolith Defense', 'Zero-Penalty XP Psychology', 'Ambiguity Disclosure'],
    xpRequired: 1700,
    linkedTopic: 'Architectural Trade-Offs (Modular Monolith vs Microservices)',
  },
];

// Deterministic local rubric evaluator when offline or when Gemini API key is not configured
export function evaluateAnswerLocally(
  question: InterviewQuestion,
  userAnswer: string
): EvaluationFeedback {
  const cleanAnswer = userAnswer.trim().toLowerCase();
  const wordCount = userAnswer.trim().split(/\s+/).filter(Boolean).length;

  const matchedConcepts: string[] = [];
  const missingConcepts: string[] = [];

  question.rubricConcepts.forEach((concept) => {
    // Extract significant keywords from each rubric concept
    const keywords = concept
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['with', 'from', 'that', 'this', 'into', 'over', 'when'].includes(w));

    const matchCount = keywords.filter((kw) => cleanAnswer.includes(kw)).length;
    const threshold = Math.max(1, Math.ceil(keywords.length * 0.4));

    if (matchCount >= threshold) {
      matchedConcepts.push(concept);
    } else {
      missingConcepts.push(concept);
    }
  });

  const coverageRatio =
    question.rubricConcepts.length > 0
      ? matchedConcepts.length / question.rubricConcepts.length
      : 0.6;

  // Depth & structure heuristics
  const hasQuantMetrics = /\b(\d+%|\d+ms|\d+h|\d+mb|p95|ttl|40%|25%)\b/i.test(userAnswer);
  const hasStructure =
    /\b(first|second|finally|situation|task|action|result|because|therefore|however|trade-off)\b/i.test(
      userAnswer
    );
  const lengthFactor = Math.min(1, wordCount / 55);

  const conceptualCorrectness = Math.round(
    Math.min(40, Math.max(12, coverageRatio * 32 + (hasQuantMetrics ? 5 : 2) + lengthFactor * 3))
  );
  const conceptCoverage = Math.round(Math.min(25, Math.max(6, coverageRatio * 23 + (wordCount > 35 ? 2 : 0))));
  const explanationQuality = Math.round(
    Math.min(15, Math.max(5, lengthFactor * 10 + (hasStructure ? 4 : 1)))
  );
  const practicalApplication = Math.round(
    Math.min(10, Math.max(3, (hasQuantMetrics ? 5 : 2) + coverageRatio * 5))
  );
  const clarityAndStructure = Math.round(
    Math.min(10, Math.max(4, (hasStructure ? 5 : 2) + (wordCount >= 25 && wordCount <= 250 ? 5 : 2)))
  );

  const totalScore = Math.min(
    100,
    conceptualCorrectness +
      conceptCoverage +
      explanationQuality +
      practicalApplication +
      clarityAndStructure
  );

  let rating: EvaluationFeedback['rating'] = 'Weak';
  if (totalScore >= 90) rating = 'Excellent';
  else if (totalScore >= 75) rating = 'Good';
  else if (totalScore >= 50) rating = 'Needs Improvement';

  const baseXpMap: Record<DifficultyLevel, number> = {
    Easy: 10,
    Medium: 20,
    Hard: 30,
    Expert: 50,
  };
  const baseXp = baseXpMap[question.difficulty] || 25;
  const bonusXp = totalScore >= 90 ? 15 : totalScore >= 75 ? 10 : 5;
  const xpEarned = baseXp + bonusXp;

  const nextDifficulty: DifficultyLevel =
    totalScore >= 85
      ? question.difficulty === 'Medium'
        ? 'Hard'
        : 'Expert'
      : totalScore < 60
      ? 'Medium'
      : question.difficulty;

  const suggestions: string[] = [];
  if (missingConcepts.length > 0) {
    suggestions.push(
      `Explicitly address missing rubric anchors: ${missingConcepts.slice(0, 2).join('; ')}.`
    );
  }
  if (!hasQuantMetrics) {
    suggestions.push(
      'Anchor your response with concrete blueprint numbers (e.g., <300ms p95 API latency, <100ms Redis cache p95, 24h/12h/1h TTLs, or 40/25/15/10/10 rubric weights).'
    );
  }
  if (!hasStructure) {
    suggestions.push(
      question.category === 'Behavioral'
        ? 'Frame your narrative explicitly around Situation, Task, Action, and a measurable Result (STAR).'
        : 'Structure your explanation into clear layers: Request Validation → Cache/Lock Layer → Core Service Logic → Failure Fallback.'
    );
  }
  if (suggestions.length === 0) {
    suggestions.push(
      'Strong, comprehensive architectural response. To elevate to Staff-level depth, discuss multi-region cache invalidation and observability metrics in Sentry.'
    );
  }

  return {
    score: totalScore,
    rating,
    criterionBreakdown: {
      conceptualCorrectness,
      conceptCoverage,
      explanationQuality,
      practicalApplication,
      clarityAndStructure,
    },
    correctConcepts:
      matchedConcepts.length > 0
        ? matchedConcepts
        : ['Core domain terminology recognized; expand on architectural specifics'],
    missingConcepts,
    correctedAnswer: question.referenceAnswer,
    improvementSuggestions: suggestions,
    followUpQuestion:
      missingConcepts.length > 0
        ? `Follow-up Probe: How would you specifically implement "${missingConcepts[0]}" under high concurrency in production?`
        : `Follow-up Probe: What failure mode in "${question.topic}" would be hardest to detect in staging, and what Sentry/Redis metric would alert you?`,
    confidence: 0.94,
    xpEarned,
    nextDifficulty,
    evaluatedBy: 'deterministic-rubric-engine',
  };
}
