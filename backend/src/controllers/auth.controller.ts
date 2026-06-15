import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { ok, created, UnauthorizedError, BadRequestError, wrap } from '../utils/api';

// ---- 注册 ----
export const register = wrap(async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body;

  // 检查邮箱是否已注册
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new BadRequestError('该邮箱已被注册');
  }

  // 创建用户
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, nickname: nickname ?? email.split('@')[0] },
  });

  // 签发 token
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  created(res, {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
    token,
  });
});

// ---- 登录 ----
export const login = wrap(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 查找用户
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('邮箱或密码错误');
  }

  // 检查状态
  if (user.status === 'banned') {
    throw new UnauthorizedError('账号已被封禁，请联系管理员');
  }
  if (user.status === 'inactive') {
    throw new UnauthorizedError('账号已被停用');
  }

  // 验证密码
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('邮箱或密码错误');
  }

  // 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 签发 token
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  ok(res, {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    role: user.role,
    token,
  });
});

// ---- 获取当前用户信息 ----
export const me = wrap(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.currentUser!.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      role: true,
      status: true,
      emailVerified: true,
      phone: true,
      phoneVerified: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('用户不存在');
  }

  ok(res, user);
});

// ---- 刷新 Token ----
export const refreshToken = wrap(async (req: Request, res: Response) => {
  // 客户端再次调用此接口（携带旧 token），签发新 token
  const newToken = signToken(
    {
      userId: req.currentUser!.userId,
      email: req.currentUser!.email,
      role: req.currentUser!.role,
    },
    'access',
  );

  ok(res, { token: newToken });
});
