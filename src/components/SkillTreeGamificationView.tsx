import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  ArrowUpRight,
  Flame,
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  TrendingUp,
} from 'lucide-react';
import {
  SkillTreeNode,
  DailyQuest,
  BadgeItem,
  TopicMasteryItem,
  QuestionCategory,
} from '../types/skillarena';

interface SkillTreeGamificationViewProps {
  skillNodes: SkillTreeNode[];
  quests: DailyQuest[];
  badges: BadgeItem[];
  topicMastery: TopicMasteryItem[];
  totalXp: number;
  streakDays: number;
  onClaimQuest: (questId: string) => void;
  onAwardBonusXp?: (xp: number) => void;
  onStartPracticeForTopic: (topic: string, category?: QuestionCategory) => void;
}

type GamificationTab = 'roadmap' | 'skill-tree';
type HorizonDays = 7 | 14;
type DailyMinutes = 30 | 45 | 60;
type DayFilter = 'all' | 'pending' | 'completed' | 'critical';

interface StudyDayTask {
  id: string;
  label: string;
  durationMin: number;
}

interface StudyScheduleDay {
  dayNumber: number;
  dateLabel: string;
  topicItem: TopicMasteryItem;
  sessionMode: 'Weak-Topic Remediation' | 'Spaced Repetition Drill' | 'Mock Synthesis Checkpoint';
  targetMasteryGain: number;
  projectedMastery: number;
  recommendedDifficulty: 'Medium' | 'Hard' | 'Expert';
  rewardXp: number;
  rationale: string;
  tasks: StudyDayTask[];
}

const ROADMAP_PROGRESS_STORAGE_KEY = 'skillarena_roadmap_completed_tasks_v1';

export const SkillTreeGamificationView: React.FC<SkillTreeGamificationViewProps> = ({
  skillNodes,
  quests,
  badges,
  topicMastery,
  totalXp,
  streakDays,
  onClaimQuest,
  onAwardBonusXp,
  onStartPracticeForTopic,
}) => {
  const [activeTab, setActiveTab] = useState<GamificationTab>('roadmap');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    skillNodes[2]?.id || skillNodes[0]?.id
  );
  const [anonymousAlias, setAnonymousAlias] = useState<string>('Architect_87A0');
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(true);

  // Roadmap configuration & persistence states
  const [horizonDays, setHorizonDays] = useState<HorizonDays>(7);
  const [dailyMinutes, setDailyMinutes] = useState<DailyMinutes>(45);
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(ROADMAP_PROGRESS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [claimedDayNumbers, setClaimedDayNumbers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem(ROADMAP_PROGRESS_STORAGE_KEY, JSON.stringify(completedTaskIds));
    } catch {
      // Ignore quota errors
    }
  }, [completedTaskIds]);

  const selectedNode = skillNodes.find((n) => n.id === selectedNodeId) || skillNodes[0];
  const currentLevel = Math.floor(totalXp / 250) + 1;

  // Rank topics from weakest to strongest using masteryScore, bktProbability, and emaTrend
  const rankedWeakTopics = useMemo(() => {
    return [...topicMastery].sort((a, b) => {
      const scoreDiff = a.masteryScore - b.masteryScore;
      if (scoreDiff !== 0) return scoreDiff;
      return a.emaTrend - b.emaTrend;
    });
  }, [topicMastery]);

  // Dynamically generate day-by-day study schedule from the user's weakest topics
  const studySchedule = useMemo<StudyScheduleDay[]>(() => {
    if (rankedWeakTopics.length === 0) return [];

    const days: StudyScheduleDay[] = [];
    const baseDate = new Date();

    // Prioritize the bottom 4 weakest topics for intensive remediation and interleave spaced repetition
    const primaryWeakPool = rankedWeakTopics.slice(0, Math.min(4, rankedWeakTopics.length));
    const secondaryPool = rankedWeakTopics.slice(Math.min(4, rankedWeakTopics.length));

    for (let i = 0; i < horizonDays; i++) {
      const dayNumber = i + 1;
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + i);

      const dateLabel =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Tomorrow'
          : targetDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

      const isCheckpointDay = dayNumber % 7 === 0;
      const isSpacedRepetitionDay = !isCheckpointDay && dayNumber % 3 === 0;

      let topicItem: TopicMasteryItem;
      let sessionMode: StudyScheduleDay['sessionMode'];

      if (isCheckpointDay) {
        // Checkpoint synthesizes the #1 weakest topic under timed interview conditions
        topicItem = primaryWeakPool[0];
        sessionMode = 'Mock Synthesis Checkpoint';
      } else if (isSpacedRepetitionDay && secondaryPool.length > 0) {
        topicItem = secondaryPool[(dayNumber / 3 - 1) % secondaryPool.length];
        sessionMode = 'Spaced Repetition Drill';
      } else {
        topicItem = primaryWeakPool[i % primaryWeakPool.length];
        sessionMode = 'Weak-Topic Remediation';
      }

      const repeatCountForTopic = days.filter((d) => d.topicItem.id === topicItem.id).length;
      const baseGain =
        dailyMinutes === 60 ? 8 : dailyMinutes === 45 ? 6 : 4;
      const targetMasteryGain = Math.min(
        98 - topicItem.masteryScore,
        Math.max(3, baseGain + repeatCountForTopic * 2)
      );
      const projectedMastery = Math.min(98, topicItem.masteryScore + targetMasteryGain);

      const recommendedDifficulty: StudyScheduleDay['recommendedDifficulty'] =
        topicItem.masteryScore < 72
          ? 'Medium'
          : topicItem.masteryScore < 85
          ? 'Hard'
          : 'Expert';

      const rewardXp = isCheckpointDay ? 75 : dailyMinutes >= 45 ? 50 : 40;

      const reviewMin = Math.round(dailyMinutes * 0.25);
      const drillMin = Math.round(dailyMinutes * 0.5);
      const followUpMin = dailyMinutes - reviewMin - drillMin;

      const tasks: StudyDayTask[] = [
        {
          id: `day-${dayNumber}-task-1`,
          label: `Review Blueprint specification & address gap: "${topicItem.keyWeakness}"`,
          durationMin: reviewMin,
        },
        {
          id: `day-${dayNumber}-task-2`,
          label: `Complete 2 ${recommendedDifficulty} ${topicItem.category} AI Interview questions on ${topicItem.topic}`,
          durationMin: drillMin,
        },
        {
          id: `day-${dayNumber}-task-3`,
          label: isCheckpointDay
            ? 'Pass 5-criterion rubric evaluation at 85+ score with zero missing core concepts'
            : 'Complete corrective follow-up probe & verify 40/25/15/10/10 rubric coverage',
          durationMin: followUpMin,
        },
      ];

      const rationale =
        topicItem.masteryScore < 75
          ? `Flagged as priority weak domain (BKT P(Known) = ${(
              topicItem.bktProbability * 100
            ).toFixed(0)}%, EMA trend ${
              topicItem.emaTrend >= 0 ? `+${topicItem.emaTrend}%` : `${topicItem.emaTrend}%`
            }). Focuses directly on "${topicItem.keyWeakness}".`
          : `Consolidates ${topicItem.category} mastery from ${topicItem.masteryScore}% toward 90%+ Topic Master threshold via spaced active recall.`;

      days.push({
        dayNumber,
        dateLabel,
        topicItem,
        sessionMode,
        targetMasteryGain,
        projectedMastery,
        recommendedDifficulty,
        rewardXp,
        rationale,
        tasks,
      });
    }

    return days;
  }, [rankedWeakTopics, horizonDays, dailyMinutes]);

  const isDayCompleted = (day: StudyScheduleDay) =>
    day.tasks.every((t) => Boolean(completedTaskIds[t.id]));

  const toggleTaskCompletion = (day: StudyScheduleDay, taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      const allDoneNow = day.tasks.every((t) => Boolean(next[t.id]));
      if (allDoneNow && !claimedDayNumbers[day.dayNumber]) {
        setClaimedDayNumbers((c) => ({ ...c, [day.dayNumber]: true }));
        if (onAwardBonusXp) {
          onAwardBonusXp(day.rewardXp);
        }
      }
      return next;
    });
  };

  const markEntireDayComplete = (day: StudyScheduleDay) => {
    const alreadyDone = isDayCompleted(day);
    setCompletedTaskIds((prev) => {
      const next = { ...prev };
      day.tasks.forEach((t) => {
        next[t.id] = !alreadyDone;
      });
      return next;
    });
    if (!alreadyDone && !claimedDayNumbers[day.dayNumber]) {
      setClaimedDayNumbers((c) => ({ ...c, [day.dayNumber]: true }));
      if (onAwardBonusXp) {
        onAwardBonusXp(day.rewardXp);
      }
    }
  };

  const resetRoadmapCheckboxes = () => {
    setCompletedTaskIds({});
    setClaimedDayNumbers({});
    localStorage.removeItem(ROADMAP_PROGRESS_STORAGE_KEY);
  };

  const filteredScheduleDays = studySchedule.filter((day) => {
    if (dayFilter === 'completed') return isDayCompleted(day);
    if (dayFilter === 'pending') return !isDayCompleted(day);
    if (dayFilter === 'critical') return day.topicItem.masteryScore < 80;
    return true;
  });

  const activeStudyDay =
    studySchedule.find((d) => d.dayNumber === selectedDayNum) ||
    filteredScheduleDays[0] ||
    studySchedule[0];

  const completedDaysCount = studySchedule.filter(isDayCompleted).length;
  const totalTasksCount = studySchedule.length * 3;
  const completedTasksCount = studySchedule.reduce(
    (acc, day) => acc + day.tasks.filter((t) => completedTaskIds[t.id]).length,
    0
  );
  const roadmapCompletionPct =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const weakestThree = rankedWeakTopics.slice(0, 3);
  const currentWeakAvg =
    weakestThree.length > 0
      ? Math.round(
          weakestThree.reduce((acc, item) => acc + item.masteryScore, 0) / weakestThree.length
        )
      : 73;
  const projectedWeakAvg = Math.min(96, currentWeakAvg + (horizonDays === 14 ? 14 : 9));

  const leaderboardEntries = [
    { rank: 1, alias: 'StaffSys_402', level: 14, xp: 3420, mastery: '94%' },
    { rank: 2, alias: 'FastAPI_Ninja', level: 12, xp: 2890, mastery: '91%' },
    {
      rank: 3,
      alias: `${anonymousAlias} (You)`,
      level: currentLevel,
      xp: totalXp,
      mastery: '86%',
      isCurrentUser: true,
    },
    { rank: 4, alias: 'Bayesian_Dev', level: 8, xp: 1940, mastery: '82%' },
    { rank: 5, alias: 'RedisCache_99', level: 7, xp: 1710, mastery: '79%' },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-8">
      {/* Header & Primary Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Section 6 & 7: Adaptive Learning & Gamification</span>
            <span aria-hidden="true">·</span>
            <span>BKT Weak-Topic Remediation</span>
            <span aria-hidden="true">·</span>
            <span>Zero Wrong-Answer Penalty</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            style={{ textWrap: 'balance' }}
          >
            Adaptive Study Roadmap & Engineering Skill Tree
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Generate a personalized day-by-day study schedule targeting your lowest Bayesian Knowledge Tracing (BKT) topics, or explore the 5-stage architectural skill tree.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tabbed View Selector inside SkillTreeGamificationView */}
          <div
            role="tablist"
            aria-label="Gamification and Study Roadmap Views"
            className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'roadmap'}
              onClick={() => setActiveTab('roadmap')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'roadmap'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Roadmap ({horizonDays}-Day Schedule)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'skill-tree'}
              onClick={() => setActiveTab('skill-tree')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'skill-tree'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Skill Tree & Quests</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums">
            <div className="px-3 py-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {streakDays}d Streak · {totalXp.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'roadmap' ? (
          <motion.div
            key="roadmap-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-6"
          >
            {/* Weak-Topic Diagnostic & Schedule Parameters Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>#1 Priority Weak Topic</span>
                  <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                    {rankedWeakTopics[0]?.masteryScore ?? 68}% Mastery
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-50 line-clamp-1">
                  {rankedWeakTopics[0]?.topic}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Gap: {rankedWeakTopics[0]?.keyWeakness}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>#2 Priority Weak Topic</span>
                  <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                    {rankedWeakTopics[1]?.masteryScore ?? 74}% Mastery
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-50 line-clamp-1">
                  {rankedWeakTopics[1]?.topic}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Gap: {rankedWeakTopics[1]?.keyWeakness}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Projected Weak-Topic Lift</span>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{projectedWeakAvg - currentWeakAvg}% BKT Gain
                  </span>
                </div>
                <div className="flex items-baseline gap-2 font-mono tabular-nums">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {currentWeakAvg}% → {projectedWeakAvg}%
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Across {horizonDays} scheduled daily sessions
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Schedule Completion</span>
                  <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                    {completedDaysCount}/{horizonDays} Days
                  </span>
                </div>
                <div className="flex items-baseline justify-between font-mono tabular-nums">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {roadmapCompletionPct}%
                  </span>
                  <span className="text-xs text-slate-500">
                    {completedTasksCount}/{totalTasksCount} tasks
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${roadmapCompletionPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Schedule Configuration Bar */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Horizon Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Horizon:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {([7, 14] as const).map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setHorizonDays(days);
                          if (selectedDayNum > days) setSelectedDayNum(1);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          horizonDays === days
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {days}-Day Plan
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Commitment Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Daily Pace:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {([30, 45, 60] as const).map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDailyMinutes(mins)}
                        className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          dailyMinutes === mins
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {mins}m/day
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  {(
                    [
                      { id: 'all', label: 'All Days' },
                      { id: 'critical', label: 'Critical (<80%)' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'completed', label: 'Completed' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDayFilter(f.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        dayFilter === f.id
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={resetRoadmapCheckboxes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Checklists</span>
              </button>
            </div>

            {/* Main 2-Column Roadmap Layout: Left Day-by-Day Timeline (7 cols) + Right Active Day Drill & Weak-Topic Ranking (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Day-by-Day Schedule List */}
              <section className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Day-by-Day Adaptive Study Schedule
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Automatically sequenced from your current topic mastery probabilities and recurring rubric omissions.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {filteredScheduleDays.length} days shown
                  </span>
                </div>

                {filteredScheduleDays.length === 0 ? (
                  <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No study days match the current filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDayFilter('all')}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Show All Scheduled Days
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredScheduleDays.map((day) => {
                      const isSelected = activeStudyDay?.dayNumber === day.dayNumber;
                      const done = isDayCompleted(day);
                      const completedCount = day.tasks.filter((t) => completedTaskIds[t.id]).length;

                      return (
                        <div
                          key={day.dayNumber}
                          onClick={() => setSelectedDayNum(day.dayNumber)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedDayNum(day.dayNumber);
                            }
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                                  Day {String(day.dayNumber).padStart(2, '0')} · {day.dateLabel}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{day.sessionMode}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">{dailyMinutes}m</span>
                              </div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {day.topicItem.topic}
                              </h3>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Target Gap: {day.topicItem.keyWeakness}
                              </div>
                            </div>

                            <div className="text-right font-mono tabular-nums shrink-0 space-y-1">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {day.topicItem.masteryScore}% →{' '}
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {day.projectedMastery}%
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {done
                                  ? `Completed (+${day.rewardXp} XP)`
                                  : `${completedCount}/${day.tasks.length} tasks · +${day.rewardXp} XP`}
                              </div>
                            </div>
                          </div>

                          {/* Inline Quick Checklist Preview */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                              {done ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : day.topicItem.masteryScore < 75 ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                              )}
                              <span>
                                {day.topicItem.category} · {day.recommendedDifficulty} Difficulty
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markEntireDayComplete(day);
                                }}
                                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap"
                              >
                                {done ? 'Mark Incomplete' : 'Complete Day'}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartPracticeForTopic(
                                    day.topicItem.topic,
                                    day.topicItem.category
                                  );
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition-colors whitespace-nowrap shrink-0"
                              >
                                <span>Start Drill</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Right Column: Selected Day Action Plan & Weakest Topics Ranking */}
              <div className="lg:col-span-5 space-y-6">
                {activeStudyDay && (
                  <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="text-xs font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                        Day {String(activeStudyDay.dayNumber).padStart(2, '0')} Study Blueprint ·{' '}
                        {activeStudyDay.dateLabel}
                      </div>
                      <span className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                        +{activeStudyDay.rewardXp} XP Reward
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug">
                        {activeStudyDay.topicItem.topic}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>{activeStudyDay.topicItem.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Current Mastery: {activeStudyDay.topicItem.masteryScore}%</span>
                        <span aria-hidden="true">·</span>
                        <span>Target: {activeStudyDay.projectedMastery}%</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-slate-100">
                        Why Adaptive ML Scheduled This:{' '}
                      </strong>
                      {activeStudyDay.rationale}
                    </div>

                    {/* Interactive Task Checklist */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>Actionable Study Checklist ({dailyMinutes} min total)</span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {
                            activeStudyDay.tasks.filter((t) => completedTaskIds[t.id]).length
                          }
                          /{activeStudyDay.tasks.length} done
                        </span>
                      </div>

                      <div className="space-y-2">
                        {activeStudyDay.tasks.map((task) => {
                          const isChecked = Boolean(completedTaskIds[task.id]);
                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => toggleTaskCompletion(activeStudyDay, task.id)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                                isChecked
                                  ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-500 line-through'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                )}
                                <span>{task.label}</span>
                              </div>
                              <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                                {task.durationMin}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onStartPracticeForTopic(
                          activeStudyDay.topicItem.topic,
                          activeStudyDay.topicItem.category
                        )
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>
                        Launch Day {activeStudyDay.dayNumber} AI Interview Drill
                      </span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </section>
                )}

                {/* Weak-Topic Mastery Diagnostic Queue */}
                <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Weakest Topics Driving Your Roadmap
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live BKT mastery ranking from your practice history
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {rankedWeakTopics.slice(0, 5).map((item, index) => (
                      <div
                        key={item.id}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {index + 1}. {item.topic}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.category} · {item.keyWeakness}
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div
                            className={`text-xs font-bold ${
                              item.masteryScore < 75
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {item.masteryScore}%
                          </div>
                          <div className="text-[10px] text-slate-400">
                            P(L)={item.bktProbability.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="skill-tree-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-8"
          >
            {/* Interactive 5-Stage Skill Tree + Node Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <section className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    SkillArena AI Mastery Path
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select any architectural stage below to inspect sub-skills and launch a grounded practice interview.
                  </p>
                </div>

                <div className="space-y-3">
                  {skillNodes.map((node) => {
                    const isSelected = selectedNode.id === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {node.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : node.status === 'active' || node.status === 'unlocked' ? (
                              <Sparkles className="w-5 h-5 text-indigo-500" />
                            ) : (
                              <Lock className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {node.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {node.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {node.mastery}%
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {node.xpRequired} XP Tier
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Right: Selected Skill Node Details & Daily Quests */}
              <div className="lg:col-span-5 space-y-6">
                {selectedNode && (
                  <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                        Stage 0{selectedNode.stage} Inspector
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        Mastery: {selectedNode.mastery}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                        {selectedNode.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {selectedNode.subtitle}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Core Blueprint Competencies Verified:
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {selectedNode.topics.map((t, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => onStartPracticeForTopic(selectedNode.linkedTopic)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                      >
                        <span>Practice {selectedNode.title.split('. ')[1]} Interview</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </section>
                )}

                {/* Daily Quests with Claimable Idempotent XP */}
                <section className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Daily Quests (Idempotent Server Claims)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Redis key: quest:&#123;anonymous_id&#125;:&#123;date&#125; (24h TTL)
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {quests.map((q) => {
                      const isReadyToClaim = q.progress >= q.target && !q.claimed;
                      return (
                        <div key={q.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {q.title}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {q.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={!isReadyToClaim}
                              onClick={() => onClaimQuest(q.id)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums ${
                                q.claimed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : isReadyToClaim
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {q.claimed
                                ? 'Claimed ✓'
                                : isReadyToClaim
                                ? `Claim +${q.rewardXp} XP`
                                : `${q.progress}/${q.target} (+${q.rewardXp} XP)`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            {/* Bottom Grid: Achievement Badges & Optional Privacy-Aware Daily Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Blueprint Achievement Badges (8 Milestones)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unlocked automatically by session accuracy, streak consistency, and topic mastery.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((b) => (
                    <motion.div
                      key={b.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 ${
                        b.unlocked
                          ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50'
                          : 'border-dashed border-slate-200 dark:border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                          <Award
                            className={`w-4 h-4 ${
                              b.unlocked ? 'text-amber-500' : 'text-slate-400'
                            }`}
                          />
                          <span>{b.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {b.condition}
                        </p>
                      </div>
                      <div className="text-right font-mono tabular-nums text-[11px] text-slate-500 shrink-0">
                        <div>{b.progressText}</div>
                        {b.unlockedAt && (
                          <div className="text-emerald-600 dark:text-emerald-400">
                            {b.unlockedAt}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Privacy-Aware Daily Leaderboard */}
              <section className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Privacy-Aware Daily Leaderboard
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Redis key: leaderboard:daily (5m TTL) · Anonymous aliases only
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLeaderboard((prev) => !prev)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                  >
                    {showLeaderboard ? 'Opt Out / Hide' : 'Opt In / Show'}
                  </button>
                </div>

                {showLeaderboard ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="alias-input"
                        className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      >
                        Anonymous Alias:
                      </label>
                      <input
                        id="alias-input"
                        type="text"
                        value={anonymousAlias}
                        onChange={(e) => setAnonymousAlias(e.target.value)}
                        className="px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                      {leaderboardEntries.map((entry, idx) => (
                        <div
                          key={entry.alias}
                          className={`py-2.5 flex items-center justify-between ${
                            entry.isCurrentUser
                              ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono tabular-nums w-5 text-slate-400">
                              #{idx + 1}
                            </span>
                            <span>{entry.alias}</span>
                          </div>
                          <div className="flex items-center gap-4 font-mono tabular-nums">
                            <span>Lvl {entry.level}</span>
                            <span>{entry.mastery}</span>
                            <span className="w-16 text-right">
                              {entry.xp.toLocaleString()} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p>
                      Leaderboard participation is hidden. Your practice remains 100% private.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
