import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { aiService } from '../services/ai.service';
import { ok, created, NotFoundError, BadRequestError, wrap } from '../utils/api';

// ---- AI 评分单题答案 ----
export const scoreAnswer = wrap(async (req: Request, res: Response) => {
  const answerId = Number(req.params.answerId);
  const userId = req.currentUser!.userId;

  if (isNaN(answerId)) throw new BadRequestError('记录 ID 格式错误');

  const record = await prisma.practiceRecord.findFirst({
    where: { id: answerId, userId },
    include: { question: true },
  });

  if (!record) throw new NotFoundError('练习记录不存在');
  if (!record.userAnswer) throw new BadRequestError('该记录没有提交答案');

  // 调用 AI 评分
  const result = await aiService.scoreAnswer(
    record.question.content,
    record.question.modelAnswer,
    typeof record.question.scoringPoints === 'string'
      ? JSON.parse(record.question.scoringPoints)
      : record.question.scoringPoints,
    record.userAnswer,
  );

  // 保存评分结果
  await prisma.practiceRecord.update({
    where: { id: answerId },
    data: {
      aiScore: result.score,
      aiFeedback: JSON.stringify(result),
    },
  });

  // 更新题目平均分
  const allScores = await prisma.practiceRecord.aggregate({
    where: { questionId: record.questionId, aiScore: { not: null } },
    _avg: { aiScore: true },
  });
  if (allScores._avg.aiScore != null) {
    await prisma.question.update({
      where: { id: record.questionId },
      data: { avgScore: Math.round(allScores._avg.aiScore * 100) / 100 },
    });
  }

  ok(res, result);
});

// ---- 获取最新 AI 薄弱分析 ----
export const getAnalysis = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;

  // 获取最近的分析
  const latest = await prisma.aiAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (latest) {
    return ok(res, {
      id: latest.id,
      type: latest.analysisType,
      weaknessAreas: safeJsonParse(latest.weaknessAreas),
      strengthAreas: safeJsonParse(latest.strengthAreas),
      recommendedPath: safeJsonParse(latest.recommendedPath),
      overallAssessment: latest.overallAssessment,
      createdAt: latest.createdAt,
    });
  }

  ok(res, null);
});

// ---- 手动触发 AI 分析 ----
export const triggerAnalysis = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;

  // 获取最近 50 条有评分的练习记录
  const records = await prisma.practiceRecord.findMany({
    where: { userId, aiScore: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { question: { select: { type: true } } },
  });

  if (records.length === 0) {
    throw new BadRequestError('没有足够的评分数据（请先完成一些练习并获取 AI 评分）');
  }

  const analysisData = records.map((r) => ({
    type: r.question.type,
    score: r.aiScore,
    userAnswer: r.userAnswer,
  }));

  const analysis = await aiService.analyzeWeakness(analysisData);

  // 保存分析结果
  const saved = await prisma.aiAnalysis.create({
    data: {
      userId,
      analysisType: 'manual',
      weaknessAreas: JSON.stringify(analysis.weaknessAreas),
      strengthAreas: JSON.stringify(analysis.strengthAreas),
      recommendedPath: JSON.stringify(null),
      overallAssessment: analysis.summary,
    },
  });

  created(res, {
    id: saved.id,
    type: saved.analysisType,
    weaknessAreas: analysis.weaknessAreas,
    strengthAreas: analysis.strengthAreas,
    overallAssessment: analysis.summary,
    createdAt: saved.createdAt,
  });
});

// ---- 获取 AI 推荐题目 ----
export const getRecommendations = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;

  // 从最新分析中获取薄弱板块
  const latest = await prisma.aiAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  let weakTypes: string[] = [];

  if (latest && latest.weaknessAreas) {
    const parsed = safeJsonParse(latest.weaknessAreas);
    if (Array.isArray(parsed)) {
      weakTypes = parsed.slice(0, 3).map((w: { type?: string }) => w.type).filter(Boolean);
    }
  }

  // 如果没有分析记录，返回所有类型的题目
  if (weakTypes.length === 0) {
    const types = await prisma.question.groupBy({
      by: ['type'],
      where: { status: 'published' },
    });
    weakTypes = types.map((t) => t.type);
  }

  // 每个薄弱类型推荐 2 题
  const recommendations: unknown[] = [];
  for (const type of weakTypes) {
    const questions = await prisma.question.findMany({
      where: { type, status: 'published' },
      select: {
        id: true,
        type: true,
        subtype: true,
        content: true,
        difficulty: true,
        practiceCount: true,
      },
      take: 2,
      orderBy: { practiceCount: 'asc' }, // 优先推荐练习少的
    });
    recommendations.push(...questions);
  }

  ok(res, {
    weakTypes,
    recommendations: recommendations.slice(0, 6),
  });
});

// ---- 对考试题目进行 AI 批量评分（交卷后使用）----
export const scoreExam = wrap(async (req: Request, res: Response) => {
  const examId = Number(req.params.examId);
  const userId = req.currentUser!.userId;

  if (isNaN(examId)) throw new BadRequestError('考试 ID 格式错误');

  const exam = await prisma.examRecord.findFirst({
    where: { id: examId, userId },
    include: {
      examDetails: {
        include: { question: true },
      },
    },
  });

  if (!exam) throw new NotFoundError('考试记录不存在');
  if (!exam.completedAt) throw new BadRequestError('考试尚未完成');

  let totalScore = 0;
  const results: unknown[] = [];

  for (const detail of exam.examDetails) {
    if (!detail.userAnswer || detail.userAnswer.trim().length < 10) continue;

    try {
      const result = await aiService.scoreAnswer(
        detail.question.content,
        detail.question.modelAnswer,
        typeof detail.question.scoringPoints === 'string'
          ? JSON.parse(detail.question.scoringPoints)
          : detail.question.scoringPoints,
        detail.userAnswer,
      );

      // 将 10 分制映射到本题满分（默认 10）
      const scaledScore = Math.round((result.score / 10) * (detail.maxScore ?? 10) * 10) / 10;
      await prisma.examDetail.update({
        where: { id: detail.id },
        data: { score: scaledScore },
      });
      totalScore += scaledScore;
      results.push({ detailId: detail.id, score: scaledScore, feedback: result.overallFeedback });
    } catch {
      // 评分失败不影响整体流程
      results.push({ detailId: detail.id, score: detail.score, feedback: 'AI 评分失败' });
    }

    // 更新学习进度
    await upsertProgress(userId, detail.question.type);
  }

  // 更新考试总分
  await prisma.examRecord.update({
    where: { id: examId },
    data: { totalScore },
  });

  ok(res, { examId, totalScore, maxScore: exam.maxScore, details: results });
});

// ==================== 工具 ====================

function safeJsonParse(str: string | null | undefined): unknown {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

async function upsertProgress(userId: number, questionType: string) {
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
        lastPracticeDate: today,
      },
    });
  } else {
    await prisma.learningProgress.create({
      data: {
        userId,
        questionType,
        completedQuestions: 1,
        totalQuestions: 0,
        lastPracticeDate: today,
      },
    });
  }
}
