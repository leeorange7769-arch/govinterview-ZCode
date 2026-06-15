import { Router } from 'express';
import {
  scoreAnswer,
  getAnalysis,
  triggerAnalysis,
  getRecommendations,
  scoreExam,
} from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 所有 AI 路由都需要登录
router.get('/analysis', requireAuth, getAnalysis);
router.post('/analysis', requireAuth, triggerAnalysis);
router.get('/recommendations', requireAuth, getRecommendations);
router.post('/score/:answerId', requireAuth, scoreAnswer);
router.post('/exams/:examId/score', requireAuth, scoreExam);

export default router;
