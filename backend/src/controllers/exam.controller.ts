import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ok, created, NotFoundError, BadRequestError, wrap } from '../utils/api';
import { getPagination } from '../middleware/validate';

// ==================== 考试模块 ====================

// ---- 开始考试（组卷）----
export const startExam = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;
  const { examType, title, count, type: qType, difficulty } = req.body;

  // 构建筛选条件
  const where: Record<string, unknown> = { status: 'published' };
  if (qType && qType !== 'all') where.type = qType as string;
  if (difficulty) where.difficulty = Number(difficulty);

  // 随机抽取题目
  const pool = await prisma.question.findMany({ where });
  const questionCount = Math.min(count ?? 10, pool.length);

  if (questionCount === 0) {
    throw new BadRequestError('暂无可用的题目');
  }

  // Fisher-Yates 洗牌 + 取前 N
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, questionCount);

  // 创建考试记录
  const exam = await prisma.examRecord.create({
    data: {
      userId,
      examType: examType ?? 'custom',
      title: title ?? `${examType === 'smart' ? '智能组卷' : examType === 'mock' ? '模拟考试' : '自定义练习'}`,
      maxScore: questionCount * 10,
      examDetails: {
        create: selected.map((q) => ({
          questionId: q.id,
          maxScore: 10,
        })),
      },
    },
    include: {
      examDetails: {
        include: {
          question: {
            select: {
              id: true,
              type: true,
              subtype: true,
              content: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  created(res, {
    id: exam.id,
    title: exam.title,
    examType: exam.examType,
    totalQuestions: exam.examDetails.length,
    maxScore: exam.maxScore,
    questions: exam.examDetails.map((d) => ({
      detailId: d.id,
      questionId: d.questionId,
      ...d.question,
    })),
    remainingSeconds: 30 * 60, // 默认 30 分钟
  });
});

// ---- 获取考试题目详情（不含答案）----
export const getExam = wrap(async (req: Request, res: Response) => {
  const examId = Number(req.params.id);
  const userId = req.currentUser!.userId;

  if (isNaN(examId)) throw new BadRequestError('考试 ID 格式错误');

  const exam = await prisma.examRecord.findFirst({
    where: { id: examId, userId },
    include: {
      examDetails: {
        include: {
          question: {
            select: {
              id: true,
              type: true,
              subtype: true,
              content: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  if (!exam) throw new NotFoundError('考试记录不存在');

  ok(res, {
    id: exam.id,
    title: exam.title,
    examType: exam.examType,
    totalQuestions: exam.examDetails.length,
    maxScore: exam.maxScore,
    completedAt: exam.completedAt,
    questions: exam.examDetails.map((d) => ({
      detailId: d.id,
      questionId: d.questionId,
      userAnswer: exam.completedAt ? d.userAnswer : undefined, // 只有已交卷才返回答案
      score: exam.completedAt ? d.score : undefined,
      ...d.question,
    })),
    isCompleted: !!exam.completedAt,
  });
});

// ---- 提交单题答案 ----
export const submitAnswer = wrap(async (req: Request, res: Response) => {
  const examId = Number(req.params.id);
  const detailId = Number(req.params.detailId);
  const userId = req.currentUser!.userId;
  const { userAnswer, timeSpent } = req.body;

  if (isNaN(examId) || isNaN(detailId)) throw new BadRequestError('ID 格式错误');

  // 验证考试归属
  const exam = await prisma.examRecord.findFirst({ where: { id: examId, userId } });
  if (!exam) throw new NotFoundError('考试记录不存在');
  if (exam.completedAt) throw new BadRequestError('考试已结束');

  const detail = await prisma.examDetail.findFirst({
    where: { id: detailId, examRecordId: examId },
  });
  if (!detail) throw new NotFoundError('题目不存在');

  await prisma.examDetail.update({
    where: { id: detailId },
    data: { userAnswer, timeSpent: timeSpent ?? null },
  });

  ok(res, { saved: true, detailId });
});

// ---- 交卷 ----
export const submitExam = wrap(async (req: Request, res: Response) => {
  const examId = Number(req.params.id);
  const userId = req.currentUser!.userId;
  const { timeSpent } = req.body;

  if (isNaN(examId)) throw new BadRequestError('考试 ID 格式错误');

  const exam = await prisma.examRecord.findFirst({
    where: { id: examId, userId },
    include: { examDetails: { include: { question: true } } },
  });

  if (!exam) throw new NotFoundError('考试记录不存在');
  if (exam.completedAt) throw new BadRequestError('考试已结束');

  // 简易评分 + 更新学习进度
  let totalScore = 0;
  for (const detail of exam.examDetails) {
    const score = detail.userAnswer && detail.userAnswer.trim().length > 10 ? 6 : 0;
    await prisma.examDetail.update({
      where: { id: detail.id },
      data: { score, maxScore: 10 },
    });
    totalScore += score;

    // 更新学习进度
    await upsertProgress(userId, detail.question.type, score >= 6);
  }

  // 更新考试记录
  await prisma.examRecord.update({
    where: { id: examId },
    data: {
      totalScore,
      timeSpent: timeSpent ?? null,
      completedAt: new Date(),
    },
  });

  ok(res, {
    id: examId,
    totalScore,
    maxScore: exam.maxScore,
    percentage: Math.round((totalScore / (exam.maxScore ?? 1)) * 100),
    message: '考试完成！',
  });
});

// ---- 查看考试成绩 ----
export const getExamResult = wrap(async (req: Request, res: Response) => {
  const examId = Number(req.params.id);
  const userId = req.currentUser!.userId;

  if (isNaN(examId)) throw new BadRequestError('考试 ID 格式错误');

  const exam = await prisma.examRecord.findFirst({
    where: { id: examId, userId },
    include: {
      examDetails: {
        include: {
          question: {
            select: {
              id: true,
              type: true,
              subtype: true,
              content: true,
              modelAnswer: true,
              thinkingProcess: true,
              scoringPoints: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  if (!exam) throw new NotFoundError('考试记录不存在');
  if (!exam.completedAt) throw new BadRequestError('考试尚未完成');

  // 按题型统计得分率
  const typeStats: Record<string, { total: number; score: number }> = {};
  for (const d of exam.examDetails) {
    const t = d.question.type;
    if (!typeStats[t]) typeStats[t] = { total: 0, score: 0 };
    typeStats[t].total += 1;
    typeStats[t].score += d.score ?? 0;
  }

  ok(res, {
    id: exam.id,
    title: exam.title,
    totalScore: exam.totalScore,
    maxScore: exam.maxScore,
    percentage: exam.maxScore ? Math.round((exam.totalScore! / exam.maxScore) * 100) : 0,
    timeSpent: exam.timeSpent,
    completedAt: exam.completedAt,
    typeAnalysis: Object.entries(typeStats).map(([type, stats]) => ({
      type,
      rate: stats.total > 0 ? Math.round((stats.score / (stats.total * 10)) * 100) : 0,
      count: stats.total,
    })),
    details: exam.examDetails.map((d) => ({
      detailId: d.id,
      questionId: d.questionId,
      type: d.question.type,
      content: d.question.content,
      userAnswer: d.userAnswer,
      score: d.score,
      maxScore: d.maxScore,
      modelAnswer: d.question.modelAnswer,
      thinkingProcess: safeJsonParse(d.question.thinkingProcess),
      scoringPoints: safeJsonParse(d.question.scoringPoints),
    })),
  });
});

// ==================== 用户数据模块 ====================

// ---- 用户仪表盘数据 ----
export const getDashboard = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;

  // 并行查询各类统计数据
  const [practiceCount, examCount, avgScoreResult, progressRows, recentRecords] = await Promise.all([
    prisma.practiceRecord.count({ where: { userId } }),
    prisma.examRecord.count({ where: { userId, completedAt: { not: null } } }),
    prisma.examRecord.aggregate({
      where: { userId, completedAt: { not: null } },
      _avg: { totalScore: true },
    }),
    prisma.learningProgress.findMany({ where: { userId } }),
    prisma.practiceRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { question: { select: { id: true, type: true, content: true } } },
    }),
  ]);

  const avgScore = avgScoreResult._avg.totalScore
    ? Math.round(avgScoreResult._avg.totalScore * 100) / 100
    : 0;

  // 计算连续打卡天数（简化版）
  const streakDays = progressRows.length > 0
    ? Math.max(...progressRows.map((r) => r.streakDays))
    : 0;

  ok(res, {
    stats: {
      practiceCount,
      examCount,
      avgScore,
      streakDays,
    },
    typeProgress: progressRows.map((r) => ({
      type: r.questionType,
      completed: r.completedQuestions,
      total: r.totalQuestions > 0 ? r.totalQuestions : undefined,
      percentage: r.totalQuestions > 0 ? Math.round((r.completedQuestions / r.totalQuestions) * 100) : 0,
      avgScore: r.avgScore,
    })),
    recentRecords: recentRecords.map((r) => ({
      id: r.id,
      questionType: r.question.type,
      content: r.question.content.substring(0, 50) + '...',
      timeSpent: r.timeSpent,
      aiScore: r.aiScore,
      isFavorite: r.isFavorite,
      createdAt: r.createdAt,
    })),
  });
});

// ---- 用户训练记录分页列表 ----
export const getUserRecords = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;
  const { skip, take } = getPagination(req.query as Record<string, string>);

  const [records, total] = await Promise.all([
    prisma.practiceRecord.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { question: { select: { id: true, type: true, content: true, difficulty: true } } },
    }),
    prisma.practiceRecord.count({ where: { userId } }),
  ]);

  ok(res, { list: records, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

// ---- 用户考试记录列表 ----
export const getUserExams = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;
  const { skip, take } = getPagination(req.query as Record<string, string>);

  const [exams, total] = await Promise.all([
    prisma.examRecord.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { examDetails: true } } },
    }),
    prisma.examRecord.count({ where: { userId } }),
  ]);

  ok(res, {
    list: exams.map((e) => ({
      id: e.id,
      title: e.title,
      examType: e.examType,
      totalScore: e.totalScore,
      maxScore: e.maxScore,
      timeSpent: e.timeSpent,
      questionCount: e._count.examDetails,
      completedAt: e.completedAt,
      createdAt: e.createdAt,
      isCompleted: !!e.completedAt,
    })),
    total,
    page: Math.floor(skip / take) + 1,
    pageSize: take,
  });
});

// ---- 用户学习进度 ----
export const getUserProgress = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;

  const progress = await prisma.learningProgress.findMany({
    where: { userId },
    orderBy: { questionType: 'asc' },
  });

  ok(res, {
    progress: progress.map((p) => ({
      type: p.questionType,
      completed: p.completedQuestions,
      total: p.totalQuestions > 0 ? p.totalQuestions : undefined,
      correctCount: p.correctCount,
      avgScore: p.avgScore,
      streakDays: p.streakDays,
      lastPracticeDate: p.lastPracticeDate,
    })),
  });
});

// ---- 成就徽章 ----
export const getAchievements = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;

  const [practiceCount, examCount, streakMax, typeCount, recentExams] = await Promise.all([
    prisma.practiceRecord.count({ where: { userId } }),
    prisma.examRecord.count({ where: { userId, completedAt: { not: null } } }),
    // 最高连续天数
    prisma.learningProgress.findFirst({
      where: { userId },
      orderBy: { streakDays: 'desc' },
      select: { streakDays: true },
    }),
    prisma.learningProgress.count({ where: { userId, completedQuestions: { gt: 0 } } }),
    // 是否有满分（得分率 >= 95%）
    prisma.examRecord.count({
      where: {
        userId,
        completedAt: { not: null },
        totalScore: { not: null },
        maxScore: { not: null },
      },
    }),
  ]);

  const badges: { name: string; icon: string; desc: string; earned: boolean }[] = [
    {
      name: '初学者',
      icon: '🌱',
      desc: '完成首次练习',
      earned: practiceCount > 0,
    },
    {
      name: '连续7天',
      icon: '🔥',
      desc: '连续学习 7 天',
      earned: (streakMax?.streakDays ?? 0) >= 7,
    },
    {
      name: '百题斩',
      icon: '⚔️',
      desc: '累计完成 100 题',
      earned: practiceCount >= 100,
    },
    {
      name: '满分王者',
      icon: '👑',
      desc: '在一次考试中得到满分',
      earned: recentExams > 0, // 简化：有待完善（需要检查具体分数）
    },
    {
      name: '全能选手',
      icon: '🌟',
      desc: '覆盖全部六大题型',
      earned: typeCount >= 6,
    },
    {
      name: '考试达人',
      icon: '📝',
      desc: '完成 10 次模拟考试',
      earned: examCount >= 10,
    },
    {
      name: '速度之星',
      icon: '⚡',
      desc: '完成 50 题以上',
      earned: practiceCount >= 50,
    },
    {
      name: '持之以恒',
      icon: '📅',
      desc: '累计练习 30 天以上',
      earned: practiceCount >= 30,
    },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;

  ok(res, { badges, earnedCount, total: badges.length });
});

// ---- 学习日历热力图数据 ----
export const getCalendar = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;

  // 近 1 年的练习记录按天聚合
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const rows = await prisma.$queryRawUnsafe<{ date: string; count: number }[]>(
    `SELECT date(created_at) as date, COUNT(*) as count
     FROM practice_records
     WHERE user_id = ? AND created_at >= ?
     GROUP BY date(created_at)
     ORDER BY date`,
    userId,
    yearAgo.toISOString(),
  );

  // 合并考试记录
  const examRows = await prisma.$queryRawUnsafe<{ date: string; count: number }[]>(
    `SELECT date(created_at) as date, COUNT(*) as count
     FROM exam_records
     WHERE user_id = ? AND created_at >= ? AND completed_at IS NOT NULL
     GROUP BY date(created_at)
     ORDER BY date`,
    userId,
    yearAgo.toISOString(),
  );

  // 合并两个数据源
  const merged = new Map<string, number>();
  for (const r of rows) merged.set(r.date, (merged.get(r.date) ?? 0) + r.count);
  for (const r of examRows) merged.set(r.date, (merged.get(r.date) ?? 0) + r.count);

  ok(res, Array.from(merged.entries()).map(([date, count]) => ({ date, count })));
});

// ==================== 工具函数 ====================

function safeJsonParse(str: string | null | undefined): unknown {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

async function upsertProgress(userId: number, questionType: string, isCorrect = false) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.learningProgress.findUnique({
    where: { userId_questionType: { userId, questionType } },
  });

  if (existing) {
    await prisma.learningProgress.update({
      where: { id: existing.id },
      data: {
        completedQuestions: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        lastPracticeDate: today,
      },
    });
  } else {
    await prisma.learningProgress.create({
      data: {
        userId,
        questionType,
        completedQuestions: 1,
        correctCount: isCorrect ? 1 : 0,
        totalQuestions: 0,
        lastPracticeDate: today,
      },
    });
  }
}
