import { Router } from 'express';
import { z } from 'zod';
import { register, login, me, refreshToken } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

// ---- Zod 校验 schema ----
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少 6 位').max(100),
  nickname: z.string().max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

const router = Router();

/**
 * POST /api/auth/register  注册
 * POST /api/auth/login     登录
 * GET  /api/auth/me        当前用户（需登录）
 * POST /api/auth/refresh   刷新 Token（需登录）
 */
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);
router.post('/refresh', requireAuth, refreshToken);

export default router;
