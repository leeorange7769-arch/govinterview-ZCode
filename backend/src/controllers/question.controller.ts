import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ok, created, NotFoundError, BadRequestError, wrap } from '../utils/api';
import { getPagination } from '../middleware/validate';

// ---- 公共：题目列表（分页 + 筛选）----
export const listQuestions = wrap(async (req: Request, res: Response) => {
  const { type, subtype, difficulty, status: qStatus, search } = req.query;
  const { skip, take } = getPagination(req.query as Record<string, string>);

  const where: Record<string, unknown> = {
    status: qStatus ?? 'published', // 默认只展示已发布
  };
  if (type && type !== 'all') where.type = type as string;
  if (subtype) where.subtype = subtype as string;
  if (difficulty) where.difficulty = Number(difficulty);
  if (search) {
    where.OR = [
      { content: { contains: search as string } },
      { tags: { contains: search as string } },
    ];
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        subtype: true,
        content: true,
        difficulty: true,
        tags: true,
        sourceYear: true,
        sourceRegion: true,
        viewCount: true,
        practiceCount: true,
        avgScore: true,
        createdAt: true,
      },
    }),
    prisma.question.count({ where }),
  ]);

  ok(res, { list: questions, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

// ---- 公共：题型分类树 ----
export const getTypes = wrap(async (_req: Request, res: Response) => {
  // 从数据库统计各一级分类下的二级分类及其数量
  const rows = await prisma.question.groupBy({
    by: ['type', 'subtype'],
    where: { status: 'published' },
    _count: { id: true },
  });

  // 组装为树状结构
  const tree: Record<string, { name: string; children: { name: string; count: number }[] }> = {};

  // 预定义顺序
  const typeOrder = ['综合分析', '人际关系', '组织策划', '应急应变', '自我认知', '行政实务', '情景模拟', '即时表达', '无领导小组'];

  for (const row of rows) {
    if (!tree[row.type]) {
      tree[row.type] = { name: row.type, children: [] };
    }
    const count = (row as unknown as { _count: { id: number } })._count.id;
    tree[row.type].children.push({ name: row.subtype ?? '其他', count });
  }

  // 按预定义顺序输出
  const orderedTree = typeOrder.filter((t) => tree[t]).map((t) => tree[t]);

  ok(res, orderedTree);
});

// ---- 公共：题目详情 ----
export const getQuestion = wrap(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError('题目 ID 格式错误');

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      createdByUser: {
        select: { id: true, nickname: true },
      },
    },
  });

  if (!question || (question.status !== 'published' && (!req.currentUser || req.currentUser.role !== 'admin'))) {
    throw new NotFoundError('题目不存在');
  }

  // 增加浏览量
  await prisma.question.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  // 解析 JSON 字段方便前端
  ok(res, {
    ...question,
    thinkingProcess: safeJsonParse(question.thinkingProcess),
    scoringPoints: safeJsonParse(question.scoringPoints),
    tags: safeJsonParse(question.tags),
  });
});

// ---- 需要登录：收藏/取消收藏 ----
export const toggleFavorite = wrap(async (req: Request, res: Response) => {
  const questionId = Number(req.params.id);
  const userId = req.currentUser!.userId;

  if (isNaN(questionId)) throw new BadRequestError('题目 ID 格式错误');

  // 查找已有记录
  const existing = await prisma.practiceRecord.findFirst({
    where: { userId, questionId, isFavorite: true },
  });

  if (existing) {
    // 取消收藏
    await prisma.practiceRecord.update({
      where: { id: existing.id },
      data: { isFavorite: false },
    });
    return ok(res, { favorited: false });
  }

  // 收藏（upsert 练习记录）
  await prisma.practiceRecord.create({
    data: { userId, questionId, isFavorite: true },
  });
  ok(res, { favorited: true });
});

// ---- 需要登录：提交练习 ----
export const submitPractice = wrap(async (req: Request, res: Response) => {
  const questionId = Number(req.params.id);
  const userId = req.currentUser!.userId;
  const { userAnswer, timeSpent, userNotes } = req.body;

  if (isNaN(questionId)) throw new BadRequestError('题目 ID 格式错误');

  // 验证题目存在
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new NotFoundError('题目不存在');

  // 创建或更新练习记录
  const record = await prisma.practiceRecord.create({
    data: {
      userId,
      questionId,
      userAnswer: userAnswer ?? '',
      timeSpent: timeSpent ?? null,
      userNotes: userNotes ?? null,
    },
  });

  // 更新题目练习计数
  await prisma.question.update({
    where: { id: questionId },
    data: { practiceCount: { increment: 1 } },
  });

  // 更新学习进度
  await upsertProgress(userId, question.type);

  ok(res, { id: record.id, questionId, createdAt: record.createdAt });
});

// ---- 需要登录：获取笔记 ----
export const getNotes = wrap(async (req: Request, res: Response) => {
  const questionId = Number(req.params.id);
  const userId = req.currentUser!.userId;

  if (isNaN(questionId)) throw new BadRequestError('题目 ID 格式错误');

  const record = await prisma.practiceRecord.findFirst({
    where: { userId, questionId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, userNotes: true },
  });

  ok(res, { userNotes: record?.userNotes ?? '' });
});

// ---- 需要登录：保存笔记 ----
export const saveNotes = wrap(async (req: Request, res: Response) => {
  const questionId = Number(req.params.id);
  const userId = req.currentUser!.userId;
  const { notes } = req.body;

  if (isNaN(questionId)) throw new BadRequestError('题目 ID 格式错误');

  // 查找最近的练习记录
  let record = await prisma.practiceRecord.findFirst({
    where: { userId, questionId },
    orderBy: { createdAt: 'desc' },
  });

  if (record) {
    await prisma.practiceRecord.update({
      where: { id: record.id },
      data: { userNotes: notes ?? '' },
    });
  } else {
    await prisma.practiceRecord.create({
      data: { userId, questionId, userNotes: notes ?? '' },
    });
  }

  ok(res, { saved: true });
});

// ==================== 管理员端点 ====================

// ---- 管理员：题目管理列表（含草稿/已归档）----
export const adminListQuestions = wrap(async (req: Request, res: Response) => {
  const { type, subtype, difficulty, status: qStatus, search } = req.query;
  const { skip, take } = getPagination(req.query as Record<string, string>);

  const where: Record<string, unknown> = {};
  if (type && type !== 'all') where.type = type as string;
  if (subtype) where.subtype = subtype as string;
  if (difficulty) where.difficulty = Number(difficulty);
  if (qStatus) where.status = qStatus as string;
  if (search) {
    where.OR = [
      { content: { contains: search as string } },
      { tags: { contains: search as string } },
    ];
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: {
        createdByUser: { select: { id: true, nickname: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  ok(res, { list: questions, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

// ---- 管理员：新增题目 ----
export const adminCreateQuestion = wrap(async (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.currentUser!.userId;

  const question = await prisma.question.create({
    data: {
      type: data.type,
      subtype: data.subtype ?? null,
      content: data.content,
      thinkingProcess: safeStringify(data.thinkingProcess),
      modelAnswer: data.modelAnswer ?? null,
      scoringPoints: safeStringify(data.scoringPoints),
      difficulty: data.difficulty ?? null,
      tags: safeStringify(data.tags),
      sourceYear: data.sourceYear ?? null,
      sourceRegion: data.sourceRegion ?? null,
      createdBy: userId,
      status: data.status ?? 'published',
    },
  });

  created(res, question);
});

// ---- 管理员：编辑题目 ----
export const adminUpdateQuestion = wrap(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError('题目 ID 格式错误');

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('题目不存在');

  const data = req.body;
  const updated = await prisma.question.update({
    where: { id },
    data: {
      type: data.type ?? undefined,
      subtype: data.subtype ?? undefined,
      content: data.content ?? undefined,
      thinkingProcess: data.thinkingProcess !== undefined ? safeStringify(data.thinkingProcess) : undefined,
      modelAnswer: data.modelAnswer ?? undefined,
      scoringPoints: data.scoringPoints !== undefined ? safeStringify(data.scoringPoints) : undefined,
      difficulty: data.difficulty ?? undefined,
      tags: data.tags !== undefined ? safeStringify(data.tags) : undefined,
      sourceYear: data.sourceYear ?? undefined,
      sourceRegion: data.sourceRegion ?? undefined,
      status: data.status ?? undefined,
    },
  });

  ok(res, updated);
});

// ---- 管理员：删除题目 ----
export const adminDeleteQuestion = wrap(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError('题目 ID 格式错误');

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('题目不存在');

  await prisma.question.delete({ where: { id } });
  ok(res, { deleted: true });
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

function safeStringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/**
 * 更新某用户某题型的练习进度。
 */
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
