/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Download, Award } from 'lucide-react';
import {
  DashboardWidgetConfig,
  TopicMasteryItem,
  SessionAttempt,
  TrajectoryDataPoint,
  InterviewQuestion,
  DailyQuest,
  BadgeItem,
  SkillTreeNode,
  QuestionCategory,
} from './types/skillarena';
import {
  DEFAULT_DOCUMENT_CONTEXT,
  INITIAL_WIDGET_CONFIGS,
  INITIAL_TOPIC_MASTERY,
  INITIAL_TRAJECTORY_DATA,
  INITIAL_SESSION_ATTEMPTS,
  INTERVIEW_QUESTIONS,
  INITIAL_DAILY_QUESTS,
  INITIAL_BADGES,
  SKILL_TREE_NODES,
} from './data/blueprintData';
import { DashboardView } from './components/DashboardView';
import { AIInterviewerView } from './components/AIInterviewerView';
import { AnalyticsView } from './components/AnalyticsView';
import { SkillTreeGamificationView } from './components/SkillTreeGamificationView';
import { BlueprintSourceView } from './components/BlueprintSourceView';

type ActiveSection = 'dashboard' | 'interviewer' | 'analytics' | 'gamification' | 'blueprint';

const STORAGE_KEY = 'skillarena_ai_state_v1';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('skillarena_theme');
    return saved ? saved === 'dark' : true;
  });

  const [anonymousId] = useState<string>(() => {
    const existing = localStorage.getItem('skillarena_anon_id');
    if (existing) return existing;
    const generated =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `anon-${Date.now()}`;
    localStorage.setItem('skillarena_anon_id', generated);
    return generated;
  });

  // Core application state initialized from localStorage or Blueprint defaults
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(INITIAL_WIDGET_CONFIGS);
  const [topicMastery, setTopicMastery] = useState<TopicMasteryItem[]>(INITIAL_TOPIC_MASTERY);
  const [attempts, setAttempts] = useState<SessionAttempt[]>(INITIAL_SESSION_ATTEMPTS);
  const [trajectoryData, setTrajectoryData] =
    useState<TrajectoryDataPoint[]>(INITIAL_TRAJECTORY_DATA);
  const [questions, setQuestions] = useState<InterviewQuestion[]>(INTERVIEW_QUESTIONS);
  const [quests, setQuests] = useState<DailyQuest[]>(INITIAL_DAILY_QUESTS);
  const [badges, setBadges] = useState<BadgeItem[]>(INITIAL_BADGES);
  const [skillNodes] = useState<SkillTreeNode[]>(SKILL_TREE_NODES);
  const [totalXp, setTotalXp] = useState<number>(2180);
  const [streakDays] = useState<number>(7);
  const [documentContext, setDocumentContext] = useState<string>(DEFAULT_DOCUMENT_CONTEXT);

  // Navigation filter bridge into AI Interviewer
  const [targetTopicFilter, setTargetTopicFilter] = useState<string | null>(null);
  const [targetCategoryFilter, setTargetCategoryFilter] = useState<QuestionCategory | null>(null);

  // Load persisted state on mount and merge any newly introduced widgets
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.widgets)) {
          const savedIds = new Set(parsed.widgets.map((w: DashboardWidgetConfig) => w.id));
          const missingWidgets = INITIAL_WIDGET_CONFIGS.filter((w) => !savedIds.has(w.id));
          setWidgets([...missingWidgets, ...parsed.widgets]);
        }
        if (Array.isArray(parsed.topicMastery)) {
          const hasBelowHalf = parsed.topicMastery.some(
            (t: TopicMasteryItem) => t.bktProbability < 0.5
          );
          setTopicMastery(hasBelowHalf ? parsed.topicMastery : INITIAL_TOPIC_MASTERY);
        }
        if (Array.isArray(parsed.attempts)) setAttempts(parsed.attempts);
        if (Array.isArray(parsed.trajectoryData)) setTrajectoryData(parsed.trajectoryData);
        if (Array.isArray(parsed.questions)) setQuestions(parsed.questions);
        if (Array.isArray(parsed.quests)) setQuests(parsed.quests);
        if (typeof parsed.totalXp === 'number') setTotalXp(parsed.totalXp);
        if (typeof parsed.documentContext === 'string') setDocumentContext(parsed.documentContext);
      }
    } catch {
      // Ignore storage parse errors
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          widgets,
          topicMastery,
          attempts,
          trajectoryData,
          questions,
          quests,
          totalXp,
          documentContext,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [widgets, topicMastery, attempts, trajectoryData, questions, quests, totalXp, documentContext]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('skillarena_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('skillarena_theme', 'light');
    }
  }, [isDark]);

  // Record a new AI Interview evaluation attempt & update Bayesian Knowledge Tracing mastery
  const handleRecordAttempt = (newAttempt: SessionAttempt) => {
    setAttempts((prev) => [newAttempt, ...prev]);
    setTotalXp((prev) => prev + newAttempt.feedback.xpEarned);

    // Update topic mastery with Exponential Moving Average (EMA) & BKT update step
    setTopicMastery((prev) =>
      prev.map((item) => {
        if (
          item.topic.toLowerCase().includes(newAttempt.topic.toLowerCase()) ||
          newAttempt.topic.toLowerCase().includes(item.topic.toLowerCase()) ||
          item.category === newAttempt.category
        ) {
          const updatedScore = Math.min(
            99,
            Math.round(item.masteryScore * 0.7 + newAttempt.feedback.score * 0.3)
          );
          const delta = Number((updatedScore - item.masteryScore).toFixed(1));
          const updatedBkt = Math.min(
            0.99,
            Number((updatedScore / 100).toFixed(2))
          );
          return {
            ...item,
            masteryScore: updatedScore,
            bktProbability: updatedBkt,
            emaTrend: Number((item.emaTrend + delta).toFixed(1)),
            attempts: item.attempts + 1,
            avgScore: Math.round((item.avgScore * item.attempts + newAttempt.feedback.score) / (item.attempts + 1)),
            lastPracticed: 'Just now',
            status:
              updatedScore >= 90
                ? 'Mastered'
                : updatedScore >= 80
                ? 'Proficient'
                : updatedScore >= 70
                ? 'Developing'
                : 'Needs Focus',
          };
        }
        return item;
      })
    );

    // Append new session point to real-time trajectory chart
    setTrajectoryData((prev) => {
      const nextIndex = prev.length + 1;
      const lastPoint = prev[prev.length - 1];
      const newPoint: TrajectoryDataPoint = {
        sessionLabel: `S-0${nextIndex}`,
        date: 'Now',
        overallScore: newAttempt.feedback.score,
        bktMastery: Math.min(
          98,
          Math.round(((lastPoint?.bktMastery || 84) * 0.75 + newAttempt.feedback.score * 0.25))
        ),
        technicalScore:
          newAttempt.category !== 'Behavioral'
            ? newAttempt.feedback.score
            : lastPoint?.technicalScore || 88,
        behavioralScore:
          newAttempt.category === 'Behavioral'
            ? newAttempt.feedback.score
            : lastPoint?.behavioralScore || 85,
        responseTimeSec: newAttempt.responseTimeSec,
        xpEarned: newAttempt.feedback.xpEarned,
      };
      return [...prev, newPoint];
    });

    // Update daily quests progress
    setQuests((prev) =>
      prev.map((q) => ({
        ...q,
        progress: Math.min(q.target, q.progress + 1),
      }))
    );

    // Unlock Perfectionist badge if score >= 95
    if (newAttempt.feedback.score >= 95) {
      setBadges((prev) =>
        prev.map((b) =>
          b.id === 'badge-perfectionist'
            ? { ...b, unlocked: true, unlockedAt: 'Today', progressText: `${newAttempt.feedback.score} / 95` }
            : b
        )
      );
    }
  };

  const handleStartPracticeForTopic = (topic: string, category?: QuestionCategory) => {
    setTargetTopicFilter(topic);
    if (category) setTargetCategoryFilter(category);
    setActiveSection('interviewer');
  };

  const handleClaimQuest = (questId: string) => {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.claimed || targetQuest.progress < targetQuest.target) return;
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );
    setTotalXp((prev) => prev + targetQuest.rewardXp);
  };

  const handleExportProgress = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      anonymousId,
      totalXp,
      topicMastery,
      attempts,
      trajectoryData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillarena-progress-${anonymousId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProgress = (jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && Array.isArray(parsed.topicMastery) && Array.isArray(parsed.attempts)) {
        setTopicMastery(parsed.topicMastery);
        setAttempts(parsed.attempts);
        if (typeof parsed.totalXp === 'number') setTotalXp(parsed.totalXp);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleResetAllProgress = () => {
    setWidgets(INITIAL_WIDGET_CONFIGS);
    setTopicMastery(INITIAL_TOPIC_MASTERY);
    setAttempts(INITIAL_SESSION_ATTEMPTS);
    setTrajectoryData(INITIAL_TRAJECTORY_DATA);
    setQuestions(INTERVIEW_QUESTIONS);
    setQuests(INITIAL_DAILY_QUESTS);
    setTotalXp(2180);
    setDocumentContext(DEFAULT_DOCUMENT_CONTEXT);
    localStorage.removeItem(STORAGE_KEY);
  };

  const navItems: { id: ActiveSection; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'interviewer', label: 'AI Interviewer' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'gamification', label: 'Skill Tree' },
    { id: 'blueprint', label: 'Blueprint' },
  ];

  const currentLevel = Math.floor(totalXp / 250) + 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('dashboard');
          }}
          className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 font-display"
        >
          SkillArena AI
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(item.id);
                }}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-slate-900 dark:text-white border-indigo-600 dark:border-indigo-400 font-semibold'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('interviewer')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Interview
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workspace Utility Toolbar (Theme Toggle, Mobile Nav, XP Readout & Export) */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80">
          {/* Mobile Navigation Bar (visible on <md screens) */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto w-full pb-2 border-b border-slate-100 dark:border-slate-800">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  activeSection === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Level {currentLevel}</span>
              <span aria-hidden="true">·</span>
              <span>{totalXp.toLocaleString()} XP</span>
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">
              Primary Data Source: SkillArena_AI_Full_Project_Plan.pdf
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleExportProgress}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              title="Export anonymous progress JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              aria-label="Toggle color theme"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active View Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSection === 'dashboard' && (
              <DashboardView
                widgets={widgets}
                onUpdateWidgets={setWidgets}
                onResetWidgets={() => setWidgets(INITIAL_WIDGET_CONFIGS)}
                topicMastery={topicMastery}
                attempts={attempts}
                trajectoryData={trajectoryData}
                totalXp={totalXp}
                streakDays={streakDays}
                onStartPracticeForTopic={handleStartPracticeForTopic}
                onNavigateToInterviewer={() => setActiveSection('interviewer')}
                isDark={isDark}
              />
            )}

            {activeSection === 'interviewer' && (
              <AIInterviewerView
                questions={questions}
                onAddCustomQuestion={(newQ) => setQuestions((prev) => [newQ, ...prev])}
                onRecordAttempt={handleRecordAttempt}
                attempts={attempts}
                documentContext={documentContext}
                initialTopicFilter={targetTopicFilter}
                initialCategoryFilter={targetCategoryFilter}
                onClearInitialFilter={() => {
                  setTargetTopicFilter(null);
                  setTargetCategoryFilter(null);
                }}
              />
            )}

            {activeSection === 'analytics' && (
              <AnalyticsView
                topicMastery={topicMastery}
                attempts={attempts}
                trajectoryData={trajectoryData}
                onStartPracticeForTopic={handleStartPracticeForTopic}
                isDark={isDark}
              />
            )}

            {activeSection === 'gamification' && (
              <SkillTreeGamificationView
                skillNodes={skillNodes}
                quests={quests}
                badges={badges}
                topicMastery={topicMastery}
                totalXp={totalXp}
                streakDays={streakDays}
                onClaimQuest={handleClaimQuest}
                onAwardBonusXp={(xp) => setTotalXp((prev) => prev + xp)}
                onStartPracticeForTopic={handleStartPracticeForTopic}
              />
            )}

            {activeSection === 'blueprint' && (
              <BlueprintSourceView
                documentContext={documentContext}
                onUpdateDocumentContext={setDocumentContext}
                onResetDocumentContext={() => setDocumentContext(DEFAULT_DOCUMENT_CONTEXT)}
                onExportProgress={handleExportProgress}
                onImportProgress={handleImportProgress}
                onResetAllProgress={handleResetAllProgress}
                onStartPracticeForTopic={handleStartPracticeForTopic}
                anonymousId={anonymousId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800/80 py-6 px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            SkillArena AI — Adaptive Technical & Behavioral Interview Platform · Anonymous-First Architecture
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSection('blueprint')}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Blueprint Data Source
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleExportProgress}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Export Session Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
