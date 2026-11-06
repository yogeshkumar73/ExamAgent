import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RotateCcw,
  FileText,
  ArrowRight,
  Plus,
  BookOpen,
  Award,
  Sliders,
} from 'lucide-react';
import {
  InterviewQuestion,
  QuestionCategory,
  DifficultyLevel,
  EvaluationFeedback,
  SessionAttempt,
} from '../types/skillarena';
import { evaluateAnswerLocally } from '../data/blueprintData';

interface AIInterviewerViewProps {
  questions: InterviewQuestion[];
  onAddCustomQuestion: (q: InterviewQuestion) => void;
  onRecordAttempt: (attempt: SessionAttempt) => void;
  attempts: SessionAttempt[];
  documentContext: string;
  initialTopicFilter?: string | null;
  initialCategoryFilter?: QuestionCategory | null;
  onClearInitialFilter?: () => void;
}

export const AIInterviewerView: React.FC<AIInterviewerViewProps> = ({
  questions,
  onAddCustomQuestion,
  onRecordAttempt,
  attempts,
  documentContext,
  initialTopicFilter,
  initialCategoryFilter,
  onClearInitialFilter,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'All' | QuestionCategory>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | DifficultyLevel>('All');
  const [activeQuestionId, setActiveQuestionId] = useState<string>(questions[0]?.id || '');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSourceExcerpt, setShowSourceExcerpt] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentFeedback, setCurrentFeedback] = useState<EvaluationFeedback | null>(null);

  // Timer state
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Voice dictation state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Custom AI question generator modal/drawer state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [customTopicInput, setCustomTopicInput] = useState<string>(
    'MongoDB Compound Indexes & Anonymous Session Security'
  );
  const [customCategoryInput, setCustomCategoryInput] = useState<QuestionCategory>('Technical');
  const [customDifficultyInput, setCustomDifficultyInput] = useState<DifficultyLevel>('Hard');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState<boolean>(false);

  // Apply initial topic or category filter when navigated from Dashboard or Skill Tree
  useEffect(() => {
    if (initialCategoryFilter) {
      setCategoryFilter(initialCategoryFilter);
    }
    if (initialTopicFilter) {
      const matched = questions.find(
        (q) =>
          q.topic.toLowerCase().includes(initialTopicFilter.toLowerCase()) ||
          initialTopicFilter.toLowerCase().includes(q.topic.toLowerCase())
      );
      if (matched) {
        setActiveQuestionId(matched.id);
        setCurrentFeedback(null);
        setUserAnswer('');
        setElapsedSec(0);
      }
      if (onClearInitialFilter) {
        onClearInitialFilter();
      }
    }
  }, [initialTopicFilter, initialCategoryFilter, questions, onClearInitialFilter]);

  const filteredQuestions = questions.filter((q) => {
    const matchCat = categoryFilter === 'All' || q.category === categoryFilter;
    const matchDiff = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    return matchCat && matchDiff;
  });

  const activeQuestion =
    questions.find((q) => q.id === activeQuestionId) ||
    filteredQuestions[0] ||
    questions[0];

  // Session stopwatch
  useEffect(() => {
    if (!isTimerRunning || currentFeedback) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, currentFeedback, activeQuestion?.id]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleSelectQuestion = (id: string) => {
    setActiveQuestionId(id);
    setUserAnswer('');
    setCurrentFeedback(null);
    setShowHint(false);
    setElapsedSec(0);
    setIsTimerRunning(true);
  };

  // Voice Dictation handler using browser SpeechRecognition API
  const toggleVoiceDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatusMsg(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatusMsg(
        'Browser speech recognition is not supported in this environment. Use the template or sample buttons above.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatusMsg('Listening... Speak your technical or STAR response clearly.');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript.trim()) {
          setUserAnswer((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceStatusMsg('Microphone access unavailable in preview iframe. Use text or 1-click samples.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceStatusMsg('Unable to start microphone in sandboxed preview.');
    }
  };

  const insertScaffoldTemplate = () => {
    if (!activeQuestion) return;
    if (activeQuestion.category === 'Behavioral') {
      setUserAnswer(
        `Situation: In the SkillArena AI project (${activeQuestion.blueprintSection}), we faced...\n\nTask: My responsibility was to architect...\n\nAction: Specifically, I implemented...\n\nResult: This reduced latency to <300ms p95 and improved...`
      );
    } else {
      setUserAnswer(
        `1. Core Architecture & Contract:\nIn SkillArena AI (${activeQuestion.topic}), we structure...\n\n2. Key Implementation Details & Rubric Anchors:\n- ${activeQuestion.rubricConcepts.slice(0, 2).join('\n- ')}\n\n3. Edge Cases, Caching & Failure Recovery:\nTo ensure <100ms Redis p95 and resilient fallback...`
      );
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!activeQuestion || !userAnswer.trim()) return;
    setIsEvaluating(true);
    setIsTimerRunning(false);

    let feedbackResult: EvaluationFeedback | null = null;

    try {
      const res = await fetch('/api/v1/interviewer/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQuestion.question,
          category: activeQuestion.category,
          difficulty: activeQuestion.difficulty,
          topic: activeQuestion.topic,
          referenceAnswer: activeQuestion.referenceAnswer,
          rubricCriteria: activeQuestion.rubricConcepts,
          userAnswer,
          sourceContext: documentContext,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          const d = json.data;
          const score = Math.max(0, Math.min(100, Math.round(Number(d.score) || 80)));
          const rating =
            score >= 90
              ? 'Excellent'
              : score >= 75
              ? 'Good'
              : score >= 50
              ? 'Needs Improvement'
              : 'Weak';

          feedbackResult = {
            score,
            rating,
            criterionBreakdown: {
              conceptualCorrectness: Math.min(
                40,
                Math.round(Number(d.criterionBreakdown?.conceptualCorrectness) || score * 0.4)
              ),
              conceptCoverage: Math.min(
                25,
                Math.round(Number(d.criterionBreakdown?.conceptCoverage) || score * 0.25)
              ),
              explanationQuality: Math.min(
                15,
                Math.round(Number(d.criterionBreakdown?.explanationQuality) || score * 0.15)
              ),
              practicalApplication: Math.min(
                10,
                Math.round(Number(d.criterionBreakdown?.practicalApplication) || score * 0.1)
              ),
              clarityAndStructure: Math.min(
                10,
                Math.round(Number(d.criterionBreakdown?.clarityAndStructure) || score * 0.1)
              ),
            },
            correctConcepts: Array.isArray(d.correctConcepts) ? d.correctConcepts : [],
            missingConcepts: Array.isArray(d.missingConcepts) ? d.missingConcepts : [],
            correctedAnswer: d.correctedAnswer || activeQuestion.referenceAnswer,
            improvementSuggestions: Array.isArray(d.improvementSuggestions)
              ? d.improvementSuggestions
              : [],
            followUpQuestion:
              d.followUpQuestion ||
              `How would you monitor and alert on edge-case failures in ${activeQuestion.topic}?`,
            confidence: Number(d.confidence) || 0.94,
            xpEarned: score >= 90 ? 45 : score >= 75 ? 35 : 25,
            nextDifficulty: score >= 85 ? 'Expert' : score < 60 ? 'Medium' : activeQuestion.difficulty,
            evaluatedBy: 'gemini-3.8-flash',
          };
        }
      }
    } catch {
      // Fallback handled cleanly below
    }

    if (!feedbackResult) {
      feedbackResult = evaluateAnswerLocally(activeQuestion, userAnswer);
    }

    setCurrentFeedback(feedbackResult);
    setIsEvaluating(false);

    const newAttempt: SessionAttempt = {
      id: `att-${Date.now()}`,
      questionId: activeQuestion.id,
      questionTitle: activeQuestion.title,
      category: activeQuestion.category,
      topic: activeQuestion.topic,
      difficulty: activeQuestion.difficulty,
      userAnswer,
      responseTimeSec: Math.max(12, elapsedSec),
      timestamp: 'Just now',
      feedback: feedbackResult,
    };

    onRecordAttempt(newAttempt);
  };

  const handleGenerateNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    setIsGeneratingQuestion(true);

    let createdQuestion: InterviewQuestion | null = null;

    try {
      const res = await fetch('/api/v1/interviewer/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customTopicInput,
          category: customCategoryInput,
          difficulty: customDifficultyInput,
          customDocumentText: documentContext,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          const d = json.data;
          createdQuestion = {
            id: `q-custom-${Date.now()}`,
            title: d.title || `${customTopicInput} Deep Dive`,
            question: d.question,
            category: customCategoryInput,
            topic: customTopicInput,
            difficulty: customDifficultyInput,
            blueprintSection: 'Custom Grounded Document & Experience Context',
            expectedDurationSec: Number(d.expectedDurationSec) || 120,
            hint: d.hint || 'Ground your answer in concrete architectural trade-offs and measurable SLAs.',
            referenceAnswer: d.referenceAnswer,
            rubricConcepts:
              Array.isArray(d.rubricConcepts) && d.rubricConcepts.length > 0
                ? d.rubricConcepts
                : [
                    'Core architectural mechanism',
                    'Data consistency & caching trade-offs',
                    'Failure handling & fallback guarantees',
                    'Measurable latency / reliability impact',
                  ],
            sampleStrongAnswer: d.referenceAnswer,
            samplePartialAnswer: `In our architecture for ${customTopicInput}, we implemented modular services with validation and caching to keep latency low and reliability high.`,
          };
        }
      }
    } catch {
      // Fallback synthesis below
    }

    if (!createdQuestion) {
      const isBehavioral = customCategoryInput === 'Behavioral';
      createdQuestion = {
        id: `q-custom-${Date.now()}`,
        title: isBehavioral
          ? `Behavioral (STAR): Leading ${customTopicInput}`
          : `Architectural Deep-Dive: ${customTopicInput}`,
        question: isBehavioral
          ? `Tell me about a challenging engineering decision you made regarding "${customTopicInput}" while building SkillArena AI. How did you evaluate trade-offs, align stakeholders or design constraints, and measure the outcome?`
          : `Based on your SkillArena AI technical blueprint, how did you design and implement "${customTopicInput}"? Walk through the data flow, validation contracts, caching/storage implications, and failure recovery strategy.`,
        category: customCategoryInput,
        topic: customTopicInput,
        difficulty: customDifficultyInput,
        blueprintSection: 'SkillArena AI Blueprint & Experience Context',
        expectedDurationSec: 120,
        hint: isBehavioral
          ? 'Use the STAR format (Situation, Task, Action, Result) and quantify latency, accuracy, or delivery speed.'
          : 'Cover request validation (Pydantic), Redis caching/locks, MongoDB persistence, and graceful fallback under load.',
        referenceAnswer: isBehavioral
          ? `Situation: While designing ${customTopicInput} for SkillArena AI, we needed high reliability within an 8-week MVP schedule. Task: Establish a clean architecture that avoided operational bottlenecks while meeting <300ms p95 API latency. Action: I designed modular FastAPI service contracts with Pydantic validation, Redis caching/rate-limiting, and MongoDB indexed persistence. Result: Achieved 99.5% target availability, <100ms p95 Redis lookups, and zero data integrity regressions.`
          : `In SkillArena AI, ${customTopicInput} is implemented inside our modular FastAPI service layer using strict Pydantic schemas, versioned Redis cache keys with distributed locks to prevent duplicate LLM calls, and indexed MongoDB collections with explicit TTL policies for temporary records. If an upstream AI provider times out or returns malformed output, the service executes a single repair retry before returning a safe fallback response.`,
        rubricConcepts: [
          isBehavioral
            ? 'STAR Narrative (Situation, Task, Action, Result)'
            : 'FastAPI & Pydantic contract enforcement',
          'Redis caching, TTLs & concurrency locks',
          'MongoDB schema indexing & data minimization',
          'Graceful error handling & measurable SLA (<300ms p95)',
        ],
        sampleStrongAnswer: isBehavioral
          ? `Situation: In SkillArena AI, ${customTopicInput} was critical for user trust and system stability. Task: I needed to deliver a production-ready implementation within our 8-week roadmap. Action: I decoupled the logic into a clean FastAPI service with Pydantic validation, Redis rate-limiting and caching, and deterministic test coverage. Result: We met our <300ms p95 latency target and eliminated duplicate AI calls.`
          : `We architected ${customTopicInput} using FastAPI and Pydantic models, backed by Redis caching (<100ms p95) with distributed locks and MongoDB indexed collections. All untrusted inputs are sanitized and delimited, and failures trigger a 1x repair retry or safe deterministic fallback.`,
        samplePartialAnswer: `We implemented ${customTopicInput} in our FastAPI backend with MongoDB and Redis so that requests are validated and cached efficiently.`,
      };
    }

    onAddCustomQuestion(createdQuestion);
    setActiveQuestionId(createdQuestion.id);
    setUserAnswer('');
    setCurrentFeedback(null);
    setElapsedSec(0);
    setIsTimerRunning(true);
    setIsGeneratingQuestion(false);
    setIsGeneratorOpen(false);
  };

  const handlePracticeFollowUp = () => {
    if (!currentFeedback || !activeQuestion) return;
    const followUpQ: InterviewQuestion = {
      id: `q-followup-${Date.now()}`,
      title: `Follow-Up Probe: ${activeQuestion.topic}`,
      question: currentFeedback.followUpQuestion,
      category: activeQuestion.category,
      topic: activeQuestion.topic,
      difficulty: currentFeedback.nextDifficulty,
      blueprintSection: activeQuestion.blueprintSection,
      expectedDurationSec: 90,
      hint: `Focus on the concepts flagged in your previous attempt: ${
        currentFeedback.missingConcepts.join(', ') || 'production concurrency, observability, and edge-case recovery'
      }.`,
      referenceAnswer: activeQuestion.referenceAnswer,
      rubricConcepts: activeQuestion.rubricConcepts,
      sampleStrongAnswer: activeQuestion.sampleStrongAnswer,
      samplePartialAnswer: activeQuestion.samplePartialAnswer,
    };
    onAddCustomQuestion(followUpQ);
    setActiveQuestionId(followUpQ.id);
    setUserAnswer('');
    setCurrentFeedback(null);
    setElapsedSec(0);
    setIsTimerRunning(true);
  };

  const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Header & Track Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>AI Interviewer & Rubric Evaluator</span>
            <span aria-hidden="true">·</span>
            <span>Grounded in SkillArena AI Blueprint</span>
            <span aria-hidden="true">·</span>
            <span>40/25/15/10/10 Weighted Grading</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            style={{ textWrap: 'balance' }}
          >
            Technical & Behavioral AI Interview Arena
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Practice realistic engineering and STAR behavioral questions derived directly from your project architecture and experience document.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsGeneratorOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Custom AI Question</span>
          </button>
        </div>
      </div>

      {/* Collapsible Custom AI Question Generator */}
      <AnimatePresence>
        {isGeneratorOpen && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleGenerateNewQuestion}
            className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Synthesize New Grounded Interview Question
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generates a tailored question, reference answer, and 5-part rubric grounded in your SkillArena AI blueprint and experience notes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6 space-y-1.5">
                <label
                  htmlFor="custom-topic-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Target Topic / Architecture Module / Experience Area
                </label>
                <input
                  id="custom-topic-input"
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  placeholder="e.g., Redis Lock Concurrency, FastAPI Dependency Injection, Conflict Resolution"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label
                  htmlFor="custom-cat-select"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Interview Track
                </label>
                <select
                  id="custom-cat-select"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value as QuestionCategory)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Behavioral">Behavioral (STAR)</option>
                  <option value="System Design">System Design</option>
                  <option value="Adaptive ML">Adaptive ML</option>
                </select>
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="custom-diff-select"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Difficulty
                  </label>
                  <select
                    id="custom-diff-select"
                    value={customDifficultyInput}
                    onChange={(e) => setCustomDifficultyInput(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingQuestion}
                  className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {isGeneratingQuestion ? 'Generating...' : 'Create'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Two-Zone Sandbox Layout: Left Question Deck (4 cols) + Right Interview Stage (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Filterable Question Bank & Blueprint Grounding */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Interview Question Deck ({filteredQuestions.length})
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {attempts.length} completed
              </span>
            </div>

            {/* Track Filter Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              {(['All', 'Technical', 'Behavioral', 'System Design', 'Adaptive ML'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Difficulty Filter Row */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Difficulty:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {(['All', 'Medium', 'Hard', 'Expert'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      difficultyFilter === diff
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-semibold'
                        : 'hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Question List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[480px] overflow-y-auto pr-1">
              {filteredQuestions.map((q, idx) => {
                const isSelected = activeQuestion?.id === q.id;
                const previousAttempt = attempts.find((a) => a.questionId === q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuestion(q.id)}
                    className={`w-full text-left py-3 px-3 rounded-lg transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold leading-snug line-clamp-2">
                        {idx + 1}. {q.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{q.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{q.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{q.expectedDurationSec}s</span>
                      </div>
                    </div>

                    {previousAttempt && (
                      <span className="text-xs font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {previousAttempt.feedback.score}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grounded Source Document Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Primary Document Grounding</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSourceExcerpt((prev) => !prev)}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {showSourceExcerpt ? 'Hide Excerpt' : 'Inspect Source'}
              </button>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>Source: SkillArena_AI_Full_Project_Plan.pdf</div>
              <div>Active Section: {activeQuestion?.blueprintSection}</div>
            </div>
            {showSourceExcerpt && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {documentContext}
              </div>
            )}
          </div>
        </div>

        {/* Right Zone: Active Interview Prompt, Answer Editor & AI Rubric Evaluation */}
        <div className="lg:col-span-8 space-y-6">
          {activeQuestion && (
            <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-6">
              {/* Prompt Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {activeQuestion.category} Track
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeQuestion.difficulty} Difficulty</span>
                  <span aria-hidden="true">·</span>
                  <span>Topic: {activeQuestion.topic}</span>
                </div>

                {/* Session Stopwatch */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{formatDuration(elapsedSec)}</span>
                    <span className="text-slate-400">
                      / {formatDuration(activeQuestion.expectedDurationSec)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setElapsedSec(0)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interview Question Prompt */}
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 leading-snug">
                  {activeQuestion.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  {activeQuestion.question}
                </p>
              </div>

              {/* Expected Rubric Concepts Preview & Optional Hint */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Target Rubric Dimensions:
                  </span>
                  <span>Conceptual (40%)</span>
                  <span aria-hidden="true">·</span>
                  <span>Coverage (25%)</span>
                  <span aria-hidden="true">·</span>
                  <span>Explanation (15%)</span>
                  <span aria-hidden="true">·</span>
                  <span>Application (10%)</span>
                  <span aria-hidden="true">·</span>
                  <span>Structure (10%)</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Interviewer Hint' : 'Show Interviewer Hint'}</span>
                </button>
              </div>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed"
                  >
                    <strong className="font-semibold">Coaching Hint: </strong>
                    {activeQuestion.hint}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Response Editor Toolbar (Quick-Fill Samples, Scaffold & Voice Dictation) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUserAnswer(activeQuestion.sampleStrongAnswer)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      Load Strong Blueprint Answer
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserAnswer(activeQuestion.samplePartialAnswer)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      Load Partial Answer (Test Gap Detection)
                    </button>
                    <button
                      type="button"
                      onClick={insertScaffoldTemplate}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      {activeQuestion.category === 'Behavioral'
                        ? 'Insert STAR Outline'
                        : 'Insert System Outline'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={toggleVoiceDictation}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      isListening
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Dictation</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Voice Dictation</span>
                      </>
                    )}
                  </button>
                </div>

                {voiceStatusMsg && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{voiceStatusMsg}</p>
                )}

                <textarea
                  rows={7}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Write your technical or STAR behavioral response here, or click 'Load Strong Blueprint Answer' above to test the AI Rubric Evaluator..."
                  className="w-full p-4 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {wordCount} words · {userAnswer.length} chars · Zero-XP-deduction guarantee
                  </div>

                  <div className="flex items-center gap-3">
                    {userAnswer && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserAnswer('');
                          setCurrentFeedback(null);
                        }}
                        className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      >
                        Clear
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleEvaluateAnswer}
                      disabled={isEvaluating || !userAnswer.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isEvaluating ? 'Evaluating Against Blueprint Rubric...' : 'Evaluate Response'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed AI Evaluation & Rubric Breakdown Panel */}
          <AnimatePresence>
            {currentFeedback && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                aria-label="Evaluation Result and Performance Analytics"
                className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-6"
              >
                {/* Top Score Summary Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Rubric Evaluation Complete</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Confidence: {Math.round(currentFeedback.confidence * 100)}%
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                      Rating: {currentFeedback.rating}
                    </h3>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Reward Earned</div>
                      <div className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>+{currentFeedback.xpEarned} XP</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Weighted Score</div>
                      <div className="text-3xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        {currentFeedback.score}
                        <span className="text-base font-normal text-slate-400">/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5-Criterion Weighted Rubric Bars (Section 5 of Blueprint) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    5-Criterion Weighted Rubric Breakdown (Blueprint Section 5)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                      {
                        label: 'Conceptual Correctness',
                        score: currentFeedback.criterionBreakdown.conceptualCorrectness,
                        max: 40,
                      },
                      {
                        label: 'Key Concept Coverage',
                        score: currentFeedback.criterionBreakdown.conceptCoverage,
                        max: 25,
                      },
                      {
                        label: 'Explanation Quality',
                        score: currentFeedback.criterionBreakdown.explanationQuality,
                        max: 15,
                      },
                      {
                        label: 'Practical Application',
                        score: currentFeedback.criterionBreakdown.practicalApplication,
                        max: 10,
                      },
                      {
                        label: 'Clarity & Structure',
                        score: currentFeedback.criterionBreakdown.clarityAndStructure,
                        max: 10,
                      },
                    ].map((crit) => {
                      const pct = Math.round((crit.score / crit.max) * 100);
                      return (
                        <div
                          key={crit.label}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 space-y-2"
                        >
                          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 line-clamp-1">
                            {crit.label}
                          </div>
                          <div className="flex items-baseline justify-between font-mono tabular-nums">
                            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                              {crit.score}/{crit.max}
                            </span>
                            <span className="text-[11px] text-slate-500">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Matched vs Missing Concepts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified Concepts Covered ({currentFeedback.correctConcepts.length})</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {currentFeedback.correctConcepts.map((c, i) => (
                        <li key={i} className="leading-relaxed">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Missing or Under-Explained Concepts ({currentFeedback.missingConcepts.length})</span>
                    </div>
                    {currentFeedback.missingConcepts.length === 0 ? (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        All core blueprint rubric concepts were addressed in your response.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {currentFeedback.missingConcepts.map((c, i) => (
                          <li key={i} className="leading-relaxed">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Actionable Suggestions & Reference Blueprint Answer */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Actionable Coaching Suggestions
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {currentFeedback.improvementSuggestions.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {idx + 1}. {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Reference Grounded Blueprint Answer</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentFeedback.correctedAnswer}
                    </p>
                  </div>

                  {/* Interactive Follow-Up Probe */}
                  <div className="p-4 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                        Adaptive Next Step · Recommended Difficulty: {currentFeedback.nextDifficulty}
                      </div>
                      <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                        {currentFeedback.followUpQuestion}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePracticeFollowUp}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Practice Follow-Up</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
