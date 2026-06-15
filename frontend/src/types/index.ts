export interface User {
  id: number;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: 'admin' | 'user';
  status?: string;
}

export interface Question {
  id: number;
  type: string;
  subtype: string | null;
  content: string;
  difficulty: number | null;
  tags: string[] | null;
  sourceYear: number | null;
  sourceRegion: string | null;
  viewCount: number;
  practiceCount: number;
  avgScore: number | null;
  status?: string;
  createdAt: string;
  // 详情额外字段
  thinkingProcess?: unknown[];
  modelAnswer?: string;
  scoringPoints?: unknown[];
}

export interface ExamRecord {
  id: number;
  title: string | null;
  examType: string;
  totalScore: number | null;
  maxScore: number | null;
  timeSpent: number | null;
  questionCount?: number;
  completedAt: string | null;
  createdAt: string;
  isCompleted: boolean;
}

export interface ExamDetail {
  id?: number;
  detailId?: number;
  questionId: number;
  type?: string;
  subtype?: string | null;
  content?: string;
  difficulty?: number | null;
  userAnswer?: string;
  score?: number | null;
  maxScore?: number | null;
}

export interface DashboardStats {
  practiceCount: number;
  examCount: number;
  avgScore: number;
  streakDays: number;
}

export interface TypeProgress {
  type: string;
  completed: number;
  total?: number;
  percentage: number;
  avgScore: number | null;
}

export interface DashboardData {
  stats: DashboardStats;
  typeProgress: TypeProgress[];
  recentRecords: unknown[];
}

export interface AiAnalysisData {
  id?: number;
  type?: string;
  weaknessAreas?: WeaknessArea[];
  strengthAreas?: unknown[];
  overallAssessment?: string;
  createdAt?: string;
}

export interface WeaknessArea {
  type: string;
  accuracy: number;
  commonIssues?: string[];
  suggestion?: string;
}
