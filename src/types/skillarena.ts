export type QuestionCategory = 'Technical' | 'Behavioral' | 'System Design' | 'Adaptive ML';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type RatingTier = 'Excellent' | 'Good' | 'Needs Improvement' | 'Weak';

export interface RubricBreakdown {
  conceptualCorrectness: number; // Max 40
  conceptCoverage: number;       // Max 25
  explanationQuality: number;    // Max 15
  practicalApplication: number;  // Max 10
  clarityAndStructure: number;   // Max 10
}

export interface InterviewQuestion {
  id: string;
  title: string;
  question: string;
  category: QuestionCategory;
  topic: string;
  difficulty: DifficultyLevel;
  blueprintSection: string;
  expectedDurationSec: number;
  hint: string;
  referenceAnswer: string;
  rubricConcepts: string[];
  sampleStrongAnswer: string;
  samplePartialAnswer: string;
}

export interface EvaluationFeedback {
  score: number;
  rating: RatingTier;
  criterionBreakdown: RubricBreakdown;
  correctConcepts: string[];
  missingConcepts: string[];
  correctedAnswer: string;
  improvementSuggestions: string[];
  followUpQuestion: string;
  confidence: number;
  xpEarned: number;
  nextDifficulty: DifficultyLevel;
  evaluatedBy: 'gemini-3.8-flash' | 'deterministic-rubric-engine';
}

export interface SessionAttempt {
  id: string;
  questionId: string;
  questionTitle: string;
  category: QuestionCategory;
  topic: string;
  difficulty: DifficultyLevel;
  userAnswer: string;
  responseTimeSec: number;
  timestamp: string;
  feedback: EvaluationFeedback;
}

export interface TopicMasteryItem {
  id: string;
  topic: string;
  category: QuestionCategory;
  masteryScore: number; // 0 to 100
  bktProbability: number; // 0.0 to 1.0
  emaTrend: number; // delta percentage e.g. +8.4
  attempts: number;
  avgScore: number;
  avgResponseSec: number;
  lastPracticed: string;
  status: 'Mastered' | 'Proficient' | 'Developing' | 'Needs Focus';
  keyWeakness: string;
}

export type WidgetId =
  | 'knowledge-gaps'
  | 'mastery-trajectory'
  | 'topic-competency'
  | 'rubric-radar'
  | 'live-telemetry'
  | 'weak-topic-actions'
  | 'recent-sessions';

export interface DashboardWidgetConfig {
  id: WidgetId;
  title: string;
  description: string;
  visible: boolean;
  span: 'half' | 'full';
  order: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardXp: number;
  claimed: boolean;
  category: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  condition: string;
  unlocked: boolean;
  unlockedAt?: string;
  progressText: string;
}

export interface SkillTreeNode {
  id: string;
  stage: number;
  title: string;
  subtitle: string;
  mastery: number;
  status: 'completed' | 'active' | 'unlocked' | 'locked';
  topics: string[];
  xpRequired: number;
  linkedTopic: string;
}

export interface TrajectoryDataPoint {
  sessionLabel: string;
  date: string;
  overallScore: number;
  bktMastery: number;
  technicalScore: number;
  behavioralScore: number;
  responseTimeSec: number;
  xpEarned: number;
}
