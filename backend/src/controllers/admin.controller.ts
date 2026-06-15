import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ok, NotFoundError, BadRequestError, wrap } from '../utils/api';
import { getPagination } from '../middleware/validate';

// ---- 用户列表 ----
export const listUsers = wrap(async (req: Request, res: Response) => {
  const { search, role, status } = req.query;
  const { skip, take } = getPagination(req.query as Record<string, string>);

  const where: Record<string, unknown> = {};
  if (role && role !== 'all') where.role = role as string;
  if (status && status !== 'all') where.status = status as string;
  if (search) {
    where.OR = [
      { email: { contains: search as string } },
      { nickname: { contains: search as string } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            practiceRecords: true,
            examRecords: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  ok(res, { list: users, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

// ---- 更新用户状态 ----
export const updateUser = wrap(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError('用户 ID 格式错误');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('用户不存在');

  const { status, role } = req.body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(role ? { role } : {}),
    },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  ok(res, updated);
});

// ---- 数据统计 ----
export const getStats = wrap(async (_req: Request, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    totalQuestions,
    totalExams,
    totalPractices,
    // 题型分布
    questionTypeDistribution,
    // 热门题目 TOP10
    hotQuestions,
    // 30天内活跃用户数
    activeUsers30Days,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.question.count(),
    prisma.examRecord.count(),
    prisma.practiceRecord.count(),

    // 各题型题目数量
    prisma.question.groupBy({
      by: ['type'],
      _count: { id: true },
    }),

    // 热门题目
    prisma.question.findMany({
      orderBy: { practiceCount: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        content: true,
        practiceCount: true,
        avgScore: true,
      },
    }),

    // 30天内有练习的活跃用户
    prisma.practiceRecord.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  // 用户增长趋势（按月统计，最近6个月）
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const usersInRange = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const monthMap = new Map<string, number>();
  for (const u of usersInRange) {
    const key = u.createdAt.toISOString().slice(0, 7); // YYYY-MM
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const userGrowth = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  ok(res, {
    overview: {
      totalUsers,
      activeUsers,
      totalQuestions,
      totalExams,
      totalPractices,
    },
    userGrowth,
    questionTypes: questionTypeDistribution.map((t) => ({
      type: t.type,
      count: t._count.id,
    })),
    hotQuestions: hotQuestions.map((q) => ({
      id: q.id,
      type: q.type,
      content: q.content.substring(0, 40) + '...',
      practiceCount: q.practiceCount,
      avgScore: q.avgScore,
    })),
    activeUserCount: activeUsers30Days.length,
  });
});
