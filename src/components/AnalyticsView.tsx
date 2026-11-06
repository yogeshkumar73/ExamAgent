import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  TopicMasteryItem,
  SessionAttempt,
  TrajectoryDataPoint,
  QuestionCategory,
} from '../types/skillarena';
import { ArrowUpRight, Search, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AnalyticsViewProps {
  topicMastery: TopicMasteryItem[];
  attempts: SessionAttempt[];
  trajectoryData: TrajectoryDataPoint[];
  onStartPracticeForTopic: (topic: string, category?: QuestionCategory) => void;
  isDark: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  topicMastery,
  attempts,
  trajectoryData,
  onStartPracticeForTopic,
  isDark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    attempts[0]?.id || null
  );

  const chartGridColor = isDark ? '#1E293B' : '#E2E8F0';
  const chartTextColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  const filteredMastery = topicMastery.filter(
    (t) =>
      t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.keyWeakness.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scatterPoints = topicMastery.map((t) => ({
    name: t.topic,
    avgResponseSec: t.avgResponseSec,
    masteryScore: t.masteryScore,
    attempts: t.attempts,
    category: t.category,
  }));

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId) || attempts[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Section 6: Machine Learning & Adaptive Analytics</span>
            <span aria-hidden="true">·</span>
            <span>Pandas / NumPy Feature Engineering</span>
            <span aria-hidden="true">·</span>
            <span>Bayesian Knowledge Tracing</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            style={{ textWrap: 'balance' }}
          >
            Session Performance & Bayesian Mastery Analytics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Inspect per-topic Bayesian Knowledge Tracing (BKT) probabilities, response-time velocity vs. rubric accuracy, and explainable ML practice recommendations.
          </p>
        </div>

        {/* Live Search Filter */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter topics or weaknesses..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Top 2-Column Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Score vs Response Velocity Composed Chart */}
        <section className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Rubric Accuracy vs. Response Velocity Across Sessions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tracks Exponential Moving Average (EMA) mastery growth as response latency decreases.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              -38% Response Time
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trajectoryData}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis
                  dataKey="sessionLabel"
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  domain={[40, 100]}
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[30, 110]}
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}s`}
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
                  yAxisId="left"
                  dataKey="overallScore"
                  name="Session Rubric Score (%)"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="responseTimeSec"
                  name="Response Time (sec)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right: Response Time vs Mastery Scatter */}
        <section className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Time-to-Mastery Quadrant (Pandas Feature Matrix)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              X-Axis: Mean Response Time (s) · Y-Axis: BKT Mastery Score (%).
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis
                  type="number"
                  dataKey="avgResponseSec"
                  name="Avg Response Time"
                  unit="s"
                  domain={[40, 95]}
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="masteryScore"
                  name="Mastery Score"
                  unit="%"
                  domain={[55, 100]}
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="attempts" range={[80, 260]} name="Attempts" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Scatter name="Blueprint Topics" data={scatterPoints} fill="#06B6D4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Bayesian Knowledge Tracing (BKT) Topic Matrix Table */}
      <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Bayesian Knowledge Tracing (BKT) & Feature Engineering Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Combines rule-based cold-start heuristics with BKT P(Known), EMA score trends, and recurring concept gap diagnosis.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500">
            P(T)=0.15 · P(S)=0.08 · P(G)=0.20
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Architectural / Behavioral Domain</th>
                <th className="py-2.5 px-4">Track · Status</th>
                <th className="py-2.5 px-4 text-right">BKT P(Known)</th>
                <th className="py-2.5 px-4 text-right">EMA Trend</th>
                <th className="py-2.5 px-4 text-right">Attempts · Time</th>
                <th className="py-2.5 px-4">Identified Concept Gap</th>
                <th className="py-2.5 pl-4 text-right">Adaptive Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-sm">
              {filteredMastery.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                    {item.topic}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      {item.masteryScore >= 80 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>
                        {item.category} · {item.status}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                    {(item.bktProbability * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                    <span
                      className={
                        item.emaTrend >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {item.emaTrend >= 0 ? `+${item.emaTrend}%` : `${item.emaTrend}%`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {item.attempts} runs · {item.avgResponseSec}s
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {item.keyWeakness}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <button
                      type="button"
                      onClick={() => onStartPracticeForTopic(item.topic, item.category)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                    >
                      <span>Launch Drill</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Session Attempt Deep Inspector */}
      {selectedAttempt && (
        <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Session Diagnostic Inspector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any recorded interview attempt to inspect its full 5-part rubric breakdown and missing concepts.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {attempts.map((a, idx) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAttemptId(a.id)}
                  className={`px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors ${
                    selectedAttempt.id === a.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Run #{attempts.length - idx} ({a.feedback.score}%)
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedAttempt.category} · {selectedAttempt.difficulty} · {selectedAttempt.timestamp}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedAttempt.questionTitle}
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Submitted Candidate Answer:
                </div>
                {selectedAttempt.userAnswer}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                <span>Rubric Evaluation: {selectedAttempt.feedback.rating}</span>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {selectedAttempt.feedback.score}/100 (+{selectedAttempt.feedback.xpEarned} XP)
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <div>
                  <strong className="text-slate-900 dark:text-slate-100">Matched Concepts: </strong>
                  {selectedAttempt.feedback.correctConcepts.join(' · ')}
                </div>
                {selectedAttempt.feedback.missingConcepts.length > 0 && (
                  <div>
                    <strong className="text-amber-600 dark:text-amber-400">Missing Concepts: </strong>
                    {selectedAttempt.feedback.missingConcepts.join(' · ')}
                  </div>
                )}
                <div>
                  <strong className="text-slate-900 dark:text-slate-100">Coaching Action: </strong>
                  {selectedAttempt.feedback.improvementSuggestions.join(' ')}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
