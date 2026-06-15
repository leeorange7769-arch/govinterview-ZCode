import { Router } from 'express';
import { z } from 'zod';
import {
  startExam,
  getExam,
  submitAnswer,
  submitExam,
  getExamResult,
} from '../controllers/exam.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const startExamSchema = z.object({
  examType: z.enum(['smart', 'specialty', 'mock', 'custom']),
  title: z.string().max(100).optional(),
  count: z.number().int().min(1).max(50).optional(),
  type: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
});

const answerSchema = z.object({
  userAnswer: z.string().max(10000),
  timeSpent: z.number().int().min(0).optional(),
});

const submitExamSchema = z.object({
  timeSpent: z.number().int().min(0).optional(),
});

const router = Router();

// 所有考试路由都需要登录
router.post('/start', requireAuth, validate(startExamSchema), startExam);
router.get('/:id', requireAuth, getExam);
router.post('/:id/details/:detailId/answer', requireAuth, validate(answerSchema), submitAnswer);
router.post('/:id/submit', requireAuth, validate(submitExamSchema), submitExam);
router.get('/:id/result', requireAuth, getExamResult);

export default router;
