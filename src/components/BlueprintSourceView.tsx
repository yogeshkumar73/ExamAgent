import React, { useState } from 'react';
import {
  FileText,
  Database,
  Server,
  Download,
  Upload,
  RotateCcw,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { QuestionCategory } from '../types/skillarena';

interface BlueprintSourceViewProps {
  documentContext: string;
  onUpdateDocumentContext: (updated: string) => void;
  onResetDocumentContext: () => void;
  onExportProgress: () => void;
  onImportProgress: (jsonText: string) => boolean;
  onResetAllProgress: () => void;
  onStartPracticeForTopic: (topic: string, category?: QuestionCategory) => void;
  anonymousId: string;
}

export const BlueprintSourceView: React.FC<BlueprintSourceViewProps> = ({
  documentContext,
  onUpdateDocumentContext,
  onResetDocumentContext,
  onExportProgress,
  onImportProgress,
  onResetAllProgress,
  onStartPracticeForTopic,
  anonymousId,
}) => {
  const [activeTab, setActiveTab] = useState<'lld' | 'mongodb' | 'redis' | 'roadmap'>('lld');
  const [savedNotice, setSavedNotice] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveContext = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        if (file.name.endsWith('.json')) {
          const ok = onImportProgress(content);
          setImportStatus(
            ok
              ? 'Session progress imported successfully.'
              : 'JSON file uploaded into experience source context.'
          );
          if (!ok) {
            onUpdateDocumentContext(documentContext + '\n\n' + content);
          }
        } else {
          onUpdateDocumentContext(documentContext + '\n\n' + content);
          setImportStatus(`Appended ${file.name} to AI Interviewer source context.`);
        }
      }
    };
    reader.readAsText(file);
  };

  const lldServices = [
    { file: 'content_service.py', role: 'Extract, clean, chunk, and SHA-256 hash PDF/DOCX/text content', track: 'Technical' as const },
    { file: 'topic_service.py', role: 'Detect concepts, subtopics, and prerequisite relationships', track: 'Technical' as const },
    { file: 'question_service.py', role: 'Generate grounded questions by type/difficulty; detect duplicates (<3% target)', track: 'Technical' as const },
    { file: 'evaluation_service.py', role: 'Grade against 40/25/15/10/10 rubric; Pydantic validation + 1x repair retry', track: 'Technical' as const },
    { file: 'analytics_service.py', role: 'Compute accuracy, response time p95, and recurring concept omissions', track: 'Adaptive ML' as const },
    { file: 'ml_service.py', role: 'Estimate mastery via Bayesian Knowledge Tracing (BKT) and EMA', track: 'Adaptive ML' as const },
    { file: 'adaptive_service.py', role: 'Select next question, difficulty, and spaced revision interval', track: 'Adaptive ML' as const },
    { file: 'gamification_service.py', role: 'Server-side idempotent XP, ranks, badges, streaks, and daily quests', track: 'Behavioral' as const },
    { file: 'cache_service.py', role: 'Redis versioned key lookup, TTL enforcement, and distributed locks', track: 'System Design' as const },
    { file: 'storage_service.py', role: 'MongoDB 10-collection persistence with compound & TTL indexes', track: 'System Design' as const },
  ];

  const mongoCollections = [
    { name: 'content', fields: '_id, session_id, title, content_hash, topics[], created_at' },
    { name: 'questions', fields: '_id, content_id, topic, question, difficulty, type, reference_answer, rubric' },
    { name: 'practice_sessions', fields: '_id, anonymous_id, content_id, total_questions, completed_questions, accuracy, total_xp, status' },
    { name: 'answer_attempts', fields: '_id, session_id, question_id, user_answer, score, missing_concepts[], confidence, response_time_ms' },
    { name: 'gamification', fields: 'anonymous_id, xp, level, streak, badges[], completed_quests[], updated_at' },
    { name: 'topic_mastery', fields: 'anonymous_id, topic_id, mastery_estimate, attempts, updated_at' },
    { name: 'daily_quests', fields: 'quest_id, quest_definition, date, reward_xp' },
    { name: 'leaderboard_entries', fields: 'anonymous_alias, points, period' },
    { name: 'content_chunks', fields: 'content_id, chunk_id, text, topic, hash' },
    { name: 'model_evaluations', fields: 'model_version, prompt_version, test_case, expected_score, observed_score' },
  ];

  const redisKeys = [
    { domain: 'Topic Analysis', key: 'topic_analysis:{content_hash}', ttl: '24 hours' },
    { domain: 'Question Generation', key: 'questions:{content_hash}:{config_hash}', ttl: '12 hours' },
    { domain: 'Reference Answer', key: 'reference:{question_hash}', ttl: '24 hours' },
    { domain: 'Answer Evaluation', key: 'evaluation:{question_hash}:{answer_hash}:{rubric_version}', ttl: '1 hour' },
    { domain: 'Session Analytics', key: 'analytics:{session_id}', ttl: '30 minutes' },
    { domain: 'Daily Quest', key: 'quest:{anonymous_id}:{date}', ttl: '24 hours' },
    { domain: 'Daily Leaderboard', key: 'leaderboard:daily', ttl: '5 minutes' },
    { domain: 'Rate Limiting', key: 'rate_limit:{anonymous_id}', ttl: '1 minute' },
  ];

  const roadmapPhases = [
    { week: 'Week 1', phase: 'Setup & Skeleton', deliverables: 'React/Vite, FastAPI, MongoDB, Redis, env config, API skeleton' },
    { week: 'Week 2', phase: 'Content Analysis', deliverables: 'Text/topic input, PDF/DOCX extraction, cleaning, topics, SHA-256 hashing' },
    { week: 'Week 3', phase: 'Question Generation', deliverables: 'AI integration, types/difficulty, answer keys/rubrics, duplicate detection' },
    { week: 'Week 4', phase: 'Semantic Evaluation', deliverables: 'Weighted 40/25/15/10/10 grading, corrections, feedback, Pydantic repair retry' },
    { week: 'Week 5', phase: 'Gamification Engine', deliverables: 'Server-side XP, levels, 8 badges, daily quests, streaks, skill tree' },
    { week: 'Week 6', phase: 'Analytics & Adaptive ML', deliverables: 'Pandas/NumPy features, BKT mastery, weak-topic analytics, adaptive difficulty' },
    { week: 'Week 7', phase: 'UI & Optimization', deliverables: 'Responsive UI, Motion animations, Redis lock optimization, local persistence' },
    { week: 'Week 8', phase: 'Testing & Deployment', deliverables: 'Curated human-graded benchmark (>85% agreement), security & Docker deployment' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Primary Data Source Studio</span>
            <span aria-hidden="true">·</span>
            <span>SkillArena_AI_Full_Project_Plan.pdf</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">ID: {anonymousId.slice(0, 12)}</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            style={{ textWrap: 'balance' }}
          >
            Blueprint Architecture & Experience Data Source
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Inspect the parsed technical specifications from your uploaded PDF blueprint and customize the primary experience context used by the AI Interviewer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/assets/aistudio/SkillArena_AI_Full_Project_Plan_87a08dd7.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>View Original Blueprint PDF</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Split: Left Grounded Context Editor (5 cols) + Right Blueprint Architecture Explorer (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Primary Data Source Context Editor & Anonymous Session Controls */}
        <div className="lg:col-span-5 space-y-6">
          <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Active AI Interviewer Grounding Context
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Add additional resume bullets, project metrics, or domain notes to customize AI questions and rubric grading.
                </p>
              </div>
            </div>

            <textarea
              rows={11}
              value={documentContext}
              onChange={(e) => onUpdateDocumentContext(e.target.value)}
              className="w-full p-3.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Append .TXT / .MD / .JSON</span>
                  <input
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={onResetDocumentContext}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Restore Blueprint Default
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveContext}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Context Synced</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sync to AI Interviewer</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Anonymous Session & Privacy Controls (Blueprint Section 9 & 14) */}
          <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Anonymous Persistence & Progress Portability
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Section 9 Compliance: Zero mandatory login. Export or reset your local browser session state at any time.
              </p>
            </div>

            {importStatus && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {importStatus}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExportProgress}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Export Session JSON</span>
              </button>

              <button
                type="button"
                onClick={onResetAllProgress}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Local Progress</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right: Parsed Blueprint Technical Reference Explorer */}
        <section className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Extracted Blueprint Specifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any module below to practice an interview question grounded in that specification.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              {(
                [
                  { id: 'lld', label: 'LLD Services (10)' },
                  { id: 'mongodb', label: 'MongoDB (10)' },
                  { id: 'redis', label: 'Redis TTLs (8)' },
                  { id: 'roadmap', label: '8-Wk Roadmap' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'lld' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {lldServices.map((s) => (
                <div
                  key={s.file}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <Server className="w-3.5 h-3.5" />
                      <span>app/services/{s.file}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{s.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartPracticeForTopic(s.file, s.track)}
                    className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    Practice →
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'mongodb' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {mongoCollections.map((c) => (
                <div
                  key={c.name}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <Database className="w-3.5 h-3.5" />
                      <span>db.{c.name}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {c.fields}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onStartPracticeForTopic(
                        'MongoDB Schema & TTL Index Retention',
                        'System Design'
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    Practice →
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'redis' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {redisKeys.map((r) => (
                <div
                  key={r.domain}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {r.domain}
                    </div>
                    <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      {r.key}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums text-xs text-slate-500 shrink-0">
                    TTL: {r.ttl}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {roadmapPhases.map((p) => (
                <div
                  key={p.week}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {p.week} · {p.phase}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{p.deliverables}</p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                    Blueprint Spec
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
