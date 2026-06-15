import { Router } from 'express';
import { z } from 'zod';
import {
  getDashboard,
  getUserRecords,
  getUserExams,
  getUserProgress,
  getCalendar,
  getAchievements,
} from '../controllers/exam.controller';
import { updateProfile, changePassword } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const updateProfileSchema = z.object({
  nickname: z.string().min(1, '昵称不能为空').max(50),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入旧密码'),
  newPassword: z.string().min(6, '新密码至少 6 位').max(100),
});

const router = Router();

// 用户数据路由（全部需要登录）
router.get('/dashboard', requireAuth, getDashboard);
router.get('/records', requireAuth, getUserRecords);
router.get('/exams', requireAuth, getUserExams);
router.get('/progress', requireAuth, getUserProgress);
router.get('/calendar', requireAuth, getCalendar);
router.get('/achievements', requireAuth, getAchievements);

// 个人资料修改
router.put('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
router.put('/password', requireAuth, validate(changePasswordSchema), changePassword);

export default router;
