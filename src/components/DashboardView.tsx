import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import {
  DashboardWidgetConfig,
  TopicMasteryItem,
  SessionAttempt,
  TrajectoryDataPoint,
  QuestionCategory,
  WidgetId,
} from '../types/skillarena';

interface DashboardViewProps {
  widgets: DashboardWidgetConfig[];
  onUpdateWidgets: (updated: DashboardWidgetConfig[]) => void;
  onResetWidgets: () => void;
  topicMastery: TopicMasteryItem[];
  attempts: SessionAttempt[];
  trajectoryData: TrajectoryDataPoint[];
  totalXp: number;
  streakDays: number;
  onStartPracticeForTopic: (topic: string, category?: QuestionCategory) => void;
  onNavigateToInterviewer: () => void;
  isDark: boolean;
}

interface TelemetryPoint {
  time: string;
  evalLatencyMs: number;
  redisCacheMs: number;
  score: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  widgets,
  onUpdateWidgets,
  onResetWidgets,
  topicMastery,
  attempts,
  trajectoryData,
  totalXp,
  streakDays,
  onStartPracticeForTopic,
  onNavigateToInterviewer,
  isDark,
}) => {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'All' | QuestionCategory>('All');
  const [timeframeWindow, setTimeframeWindow] = useState<'all' | 'recent'>('all');
  const [activeSeries, setActiveSeries] = useState<{
    overallScore: boolean;
    bktMastery: boolean;
    technicalScore: boolean;
    behavioralScore: boolean;
  }>({
    overallScore: true,
    bktMastery: true,
    technicalScore: true,
    behavioralScore: false,
  });

  // Live telemetry stream state
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryPoint[]>([
    { time: '10:00:05', evalLatencyMs: 640, redisCacheMs: 18, score: 84 },
    { time: '10:00:10', evalLatencyMs: 590, redisCacheMs: 14, score: 88 },
    { time: '10:00:15', evalLatencyMs: 420, redisCacheMs: 11, score: 86 },
    { time: '10:00:20', evalLatencyMs: 510, redisCacheMs: 15, score: 91 },
    { time: '10:00:25', evalLatencyMs: 470, redisCacheMs: 12, score: 89 },
    { time: '10:00:30', evalLatencyMs: 390, redisCacheMs: 10, score: 93 },
  ]);

  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setTelemetryStream((prev) => {
        const lastScore = prev[prev.length - 1]?.score ?? 88;
        const delta = Math.floor(Math.random() * 5) - 2;
        const nextScore = Math.max(76, Math.min(98, lastScore + delta));
        const nextEvalMs = Math.floor(360 + Math.random() * 240);
        const nextRedisMs = Math.floor(9 + Math.random() * 14);
        return [
          ...prev.slice(-9),
          {
            time: timeStr,
            evalLatencyMs: nextEvalMs,
            redisCacheMs: nextRedisMs,
            score: nextScore,
          },
        ];
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Derived metrics
  const currentLevel = Math.floor(totalXp / 250) + 1;
  const currentRank =
    currentLevel >= 21
      ? 'Master Architect'
      : currentLevel >= 11
      ? 'Advanced Engineer'
      : currentLevel >= 6
      ? 'Intermediate Practitioner'
      : 'Foundational Builder';

  const filteredTopics =
    selectedCategory === 'All'
      ? topicMastery
      : topicMastery.filter((t) => t.category === selectedCategory);

  const avgMastery =
    filteredTopics.length > 0
      ? Math.round(
          filteredTopics.reduce((sum, item) => sum + item.masteryScore, 0) / filteredTopics.length
        )
      : 82;

  const avgRubricScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.feedback.score, 0) / attempts.length)
      : 85;

  const displayedTrajectory =
    timeframeWindow === 'recent' ? trajectoryData.slice(-5) : trajectoryData;

  // Aggregate 5-criterion rubric percentages from recent attempts
  const latestBreakdown = attempts[0]?.feedback.criterionBreakdown ?? {
    conceptualCorrectness: 36,
    conceptCoverage: 22,
    explanationQuality: 13,
    practicalApplication: 9,
    clarityAndStructure: 9,
  };

  const rubricRadarData = [
    {
      criterion: 'Conceptual (40%)',
      percentage: Math.round((latestBreakdown.conceptualCorrectness / 40) * 100),
      benchmark: 85,
    },
    {
      criterion: 'Coverage (25%)',
      percentage: Math.round((latestBreakdown.conceptCoverage / 25) * 100),
      benchmark: 82,
    },
    {
      criterion: 'Explanation (15%)',
      percentage: Math.round((latestBreakdown.explanationQuality / 15) * 100),
      benchmark: 80,
    },
    {
      criterion: 'Application (10%)',
      percentage: Math.round((latestBreakdown.practicalApplication / 10) * 100),
      benchmark: 78,
    },
    {
      criterion: 'Clarity/STAR (10%)',
      percentage: Math.round((latestBreakdown.clarityAndStructure / 10) * 100),
      benchmark: 85,
    },
  ];

  // Widget manipulation handlers
  const toggleWidgetVisibility = (id: WidgetId) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    onUpdateWidgets(updated);
  };

  const toggleWidgetSpan = (id: WidgetId) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, span: w.span === 'full' ? ('half' as const) : ('full' as const) } : w
    );
    onUpdateWidgets(updated);
  };

  const moveWidgetOrder = (id: WidgetId, direction: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((w) => w.id === id);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const currentOrder = sorted[index].order;
    sorted[index] = { ...sorted[index], order: sorted[swapIndex].order };
    sorted[swapIndex] = { ...sorted[swapIndex], order: currentOrder };
    onUpdateWidgets(sorted);
  };

  const sortedVisibleWidgets = [...widgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  const chartGridColor = isDark ? '#1E293B' : '#E2E8F0';
  const chartTextColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="space-y-8">
      {/* Executive Header & Interactive Filter / Widget Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Adaptive Learning Workspace</span>
            <span aria-hidden="true">·</span>
            <span>Blueprint Source Grounded</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Anonymous Session Persisted</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            style={{ textWrap: 'balance' }}
          >
            Real-Time Interview Readiness & Bayesian Mastery
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Interactive telemetry across your SkillArena AI architecture modules, 5-criterion rubric evaluations, and Bayesian Knowledge Tracing (BKT) topic models.
          </p>
        </div>

        {/* Interactive Filter & Widget Customizer Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Segmented Control */}
          <div
            className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 rounded-lg"
            role="group"
            aria-label="Filter dashboard by interview track"
          >
            {(['All', 'Technical', 'Behavioral', 'System Design', 'Adaptive ML'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCustomizerOpen((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              isCustomizerOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Customize Widgets ({sortedVisibleWidgets.length}/{widgets.length})</span>
          </button>
        </div>
      </div>

      {/* Collapsible Widget Customizer Drawer */}
      <AnimatePresence>
        {isCustomizerOpen && (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            aria-label="Dashboard Widget Customizer"
            className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Customize Dashboard Layout & Active Widgets
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle visibility, switch between Half-Width (1 col) and Full-Width (2 col) spans, or reorder panels. Changes persist locally.
                </p>
              </div>
              <button
                type="button"
                onClick={onResetWidgets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default Layout</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...widgets]
                .sort((a, b) => a.order - b.order)
                .map((w, idx) => (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                      w.visible
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50'
                        : 'border-dashed border-slate-200 dark:border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {idx + 1}. {w.title}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {w.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleWidgetVisibility(w.id)}
                        className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title={w.visible ? 'Hide widget' : 'Show widget'}
                      >
                        {w.visible ? <Eye className="w-4 h-4 text-indigo-500" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleWidgetSpan(w.id)}
                        className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium whitespace-nowrap"
                      >
                        {w.span === 'full' ? (
                          <>
                            <Minimize2 className="w-3.5 h-3.5" />
                            <span>Full Width (2 Col)</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Half Width (1 Col)</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveWidgetOrder(w.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                          title="Move earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveWidgetOrder(w.id, 'down')}
                          disabled={idx === widgets.length - 1}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                          title="Move later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Full-Width 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Bayesian Topic Mastery</span>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
              +6.2% vs last wk
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              {avgMastery}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredTopics.length} domains tracked
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
              style={{ width: `${avgMastery}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Mean Rubric Evaluation</span>
            <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
              {avgRubricScore >= 90 ? 'Excellent Tier' : 'Good Tier'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              {avgRubricScore}
              <span className="text-base font-normal text-slate-400">/100</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {attempts.length} graded sessions
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>40% Conceptual</span>
            <span aria-hidden="true">·</span>
            <span>25% Coverage</span>
            <span aria-hidden="true">·</span>
            <span>35% Depth</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Progression & Rank</span>
            <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-medium">
              Level {currentLevel}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              {totalXp.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-400">XP</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
              {currentRank}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {250 - (totalXp % 250)} XP to Level {currentLevel + 1} · No wrong-answer penalty
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Practice Consistency</span>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
              {streakDays}-Day Streak
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              61<span className="text-base font-normal text-slate-400">s</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Avg response time
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Redis Cache p95: 12ms</span>
            <button
              type="button"
              onClick={onNavigateToInterviewer}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>Practice now</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Customizable Widget Grid */}
      {sortedVisibleWidgets.length === 0 ? (
        <div className="p-12 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            All dashboard widgets are currently hidden.
          </p>
          <button
            type="button"
            onClick={onResetWidgets}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Restore Default Widgets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {sortedVisibleWidgets.map((widget) => {
            const colSpanClass = widget.span === 'full' ? 'lg:col-span-12' : 'lg:col-span-6';

            if (widget.id === 'knowledge-gaps') {
              const criticalGapTopics = filteredTopics
                .filter((t) => t.bktProbability < 0.5)
                .sort((a, b) => a.bktProbability - b.bktProbability);

              const allBelowHalfCount = topicMastery.filter((t) => t.bktProbability < 0.5).length;

              return (
                <motion.section
                  layout
                  key={widget.id}
                  aria-label="Knowledge Gaps Widget"
                  className={`${colSpanClass} p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-5`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Critical BKT Threshold Alert: P(Known) &lt; 0.50</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {criticalGapTopics.length} active gap{criticalGapTopics.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {widget.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {selectedCategory !== 'All' && allBelowHalfCount > criticalGapTopics.length && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('All')}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Show All {allBelowHalfCount} Gaps
                        </button>
                      )}
                      {criticalGapTopics.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onStartPracticeForTopic(
                              criticalGapTopics[0].topic,
                              criticalGapTopics[0].category
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Remediate Lowest Gap ({criticalGapTopics[0].bktProbability.toFixed(2)})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {criticalGapTopics.length === 0 ? (
                    <div className="p-6 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 text-center space-y-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Zero Critical Knowledge Gaps Below 0.50 BKT Probability
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        All tracked topics in this view currently exceed the 0.50 Bayesian Knowledge Tracing threshold.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {criticalGapTopics.map((item) => {
                        const gapToThreshold = Math.max(0.01, Number((0.5 - item.bktProbability).toFixed(2)));
                        const pctOfHalf = Math.min(100, Math.round((item.bktProbability / 0.5) * 100));

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                  {item.category} · {item.attempts} attempts
                                </span>
                                <span className="font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                                  P(L) = {item.bktProbability.toFixed(2)}
                                </span>
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                {item.topic}
                              </h3>

                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  Identified Gap:{' '}
                                </span>
                                {item.keyWeakness}
                              </p>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                  <span>Current: {(item.bktProbability * 100).toFixed(0)}%</span>
                                  <span>+{gapToThreshold.toFixed(2)} to 0.50 threshold</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-rose-500 dark:bg-rose-400 transition-all duration-300"
                                    style={{ width: `${pctOfHalf}%` }}
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onStartPracticeForTopic(item.topic, item.category)}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <span>Practice in AI Interviewer</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.section>
              );
            }

            if (widget.id === 'mastery-trajectory') {
              return (
                <motion.section
                  layout
                  key={widget.id}
                  className={`${colSpanClass} p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-5`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {widget.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Series Toggles */}
                      {(
                        [
                          { key: 'overallScore', label: 'Overall Score', color: 'text-indigo-600 dark:text-indigo-400' },
                          { key: 'bktMastery', label: 'BKT Mastery', color: 'text-cyan-600 dark:text-cyan-400' },
                          { key: 'technicalScore', label: 'Technical', color: 'text-emerald-600 dark:text-emerald-400' },
                          { key: 'behavioralScore', label: 'Behavioral', color: 'text-amber-600 dark:text-amber-400' },
                        ] as const
                      ).map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() =>
                            setActiveSeries((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
                          }
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                            activeSeries[s.key]
                              ? `${s.color} border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90`
                              : 'text-slate-400 border-transparent hover:text-slate-600'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}

                      <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setTimeframeWindow('recent')}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            timeframeWindow === 'recent'
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Last 5
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimeframeWindow('all')}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            timeframeWindow === 'all'
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          All ({trajectoryData.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={displayedTrajectory}
                        margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="gradOverall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="gradBkt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke={chartTextColor}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[45, 100]}
                          stroke={chartTextColor}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        {activeSeries.overallScore && (
                          <Area
                            type="monotone"
                            dataKey="overallScore"
                            name="Overall Rubric Score"
                            stroke="#6366F1"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#gradOverall)"
                          />
                        )}
                        {activeSeries.bktMastery && (
                          <Area
                            type="monotone"
                            dataKey="bktMastery"
                            name="BKT Mastery Probability"
                            stroke="#06B6D4"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#gradBkt)"
                          />
                        )}
                        {activeSeries.technicalScore && (
                          <Area
                            type="monotone"
                            dataKey="technicalScore"
                            name="Technical Track"
                            stroke="#10B981"
                            strokeWidth={2}
                            fillOpacity={0}
                          />
                        )}
                        {activeSeries.behavioralScore && (
                          <Area
                            type="monotone"
                            dataKey="behavioralScore"
                            name="Behavioral (STAR)"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            fillOpacity={0}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.section>
              );
            }

            if (widget.id === 'topic-competency') {
              return (
                <motion.section
                  layout
                  key={widget.id}
                  className={`${colSpanClass} p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Click any bar or domain below to launch a targeted AI Interviewer drill.
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      BKT P(Known)
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredTopics.map((t) => ({
                          name: t.topic.split(' ')[0] + ' ' + (t.topic.split(' ')[1] || ''),
                          fullTopic: t.topic,
                          masteryScore: t.masteryScore,
                          avgScore: t.avgScore,
                          category: t.category,
                        }))}
                        margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke={chartTextColor}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke={chartTextColor}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="masteryScore"
                          name="BKT Mastery %"
                          fill="#6366F1"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(data: any) => {
                            const payload = data?.payload || data;
                            if (payload?.fullTopic) {
                              onStartPracticeForTopic(payload.fullTopic, payload.category);
                            }
                          }}
                        />
                        <Bar
                          dataKey="avgScore"
                          name="Mean Rubric Score"
                          fill="#06B6D4"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.section>
              );
            }

            if (widget.id === 'rubric-radar') {
              return (
                <motion.section
                  layout
                  key={widget.id}
                  className={`${colSpanClass} p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Blueprint Section 5 weighted rubric alignment vs. Senior Engineering target.
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                      100% Scale
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={rubricRadarData}>
                        <PolarGrid stroke={chartGridColor} />
                        <PolarAngleAxis dataKey="criterion" tick={{ fill: chartTextColor, fontSize: 11 }} />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fill: chartTextColor, fontSize: 10 }}
                        />
                        <Radar
                          name="Your Performance %"
                          dataKey="percentage"
                          stroke="#6366F1"
                          fill="#6366F1"
                          fillOpacity={0.35}
                        />
                        <Radar
                          name="Target Benchmark %"
                          dataKey="benchmark"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.section>
              );
            }

            if (widget.id === 'live-telemetry') {
              return (
                <motion.section
                  layout
                  key={widget.id}
                  className={`${colSpanClass} p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Models Redis lookup (&lt;100ms p95 target) vs. AI evaluator pipeline latency.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLiveStreaming((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      {isLiveStreaming ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-amber-500" />
                          <span>Pause Stream</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Resume Stream</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={telemetryStream}
                        margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                        <XAxis
                          dataKey="time"
                          stroke={chartTextColor}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke={chartTextColor}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}ms`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="evalLatencyMs"
                          name="AI Evaluator Latency (ms)"
                          stroke="#6366F1"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="redisCacheMs"
                          name="Redis Cache Lookup (ms)"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    <span>Key: evaluation:&#123;q_hash&#125;:&#123;a_hash&#125;:v1</span>
                    <span>TTL: 3600s (1h)</span>
                  </div>
                </motion.section>
              );
            }

            if (widget.id === 'weak-topic-actions') {
              const priorityTopics = [...topicMastery]
                .sort((a, b) => a.masteryScore - b.masteryScore)
                .slice(0, 4);

              return (
                <motion.section
                  layout
                  key={widget.id}
                  className={`${colSpanClass} p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Ranked by Bayesian Knowledge Tracing P(Known) and recent concept omissions.
                      </p>
                    </div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                      +75 XP Improvement Bonus
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {priorityTopics.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.masteryScore < 75 ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {item.topic}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>Focus: {item.keyWeakness}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right font-mono tabular-nums">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.masteryScore}%
                            </div>
                            <div className="text-[11px] text-slate-500">
                              P(L)={item.bktProbability.toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onStartPracticeForTopic(item.topic, item.category)}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            Practice Drill
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              );
            }

            if (widget.id === 'recent-sessions') {
              return (
                <motion.section
                  layout
                  key={widget.id}
                  className={`${colSpanClass} p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {widget.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onNavigateToInterviewer}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>New AI Interview Session</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 pr-4">Question & Blueprint Domain</th>
                          <th className="py-2.5 px-4">Track · Difficulty</th>
                          <th className="py-2.5 px-4 text-right">Rubric Score</th>
                          <th className="py-2.5 px-4 text-right">Rating</th>
                          <th className="py-2.5 px-4 text-right">Time</th>
                          <th className="py-2.5 pl-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-sm">
                        {attempts.map((attempt) => (
                          <tr
                            key={attempt.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 pr-4">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {attempt.questionTitle}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{attempt.topic}</span>
                                <span aria-hidden="true">·</span>
                                <span>{attempt.timestamp}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {attempt.category} · {attempt.difficulty}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                              {attempt.feedback.score}/100
                            </td>
                            <td className="py-3 px-4 text-right text-xs font-medium whitespace-nowrap">
                              <span
                                className={
                                  attempt.feedback.rating === 'Excellent'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : attempt.feedback.rating === 'Good'
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }
                              >
                                {attempt.feedback.rating}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                              {attempt.responseTimeSec}s
                            </td>
                            <td className="py-3 pl-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  onStartPracticeForTopic(attempt.topic, attempt.category)
                                }
                                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                              >
                                Re-practice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.section>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
