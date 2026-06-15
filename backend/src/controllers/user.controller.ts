import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { ok, BadRequestError, UnauthorizedError, wrap } from '../utils/api';

// ---- 更新个人资料（昵称）----
export const updateProfile = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;
  const { nickname } = req.body;

  if (!nickname || nickname.trim().length === 0) {
    throw new BadRequestError('昵称不能为空');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { nickname: nickname.trim() },
    select: {
      id: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      role: true,
    },
  });

  ok(res, updated);
});

// ---- 修改密码 ----
export const changePassword = wrap(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new BadRequestError('请填写旧密码和新密码');
  }
  if (newPassword.length < 6) {
    throw new BadRequestError('新密码至少 6 位');
  }
  if (oldPassword === newPassword) {
    throw new BadRequestError('新密码不能与旧密码相同');
  }

  // 验证旧密码
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('用户不存在');

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) throw new BadRequestError('旧密码不正确');

  // 更新密码
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  ok(res, { message: '密码修改成功' });
});
