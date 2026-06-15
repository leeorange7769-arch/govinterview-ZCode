import { Router } from 'express';
import { z } from 'zod';
import {
  listQuestions,
  getTypes,
  getQuestion,
  toggleFavorite,
  submitPractice,
  getNotes,
  saveNotes,
  adminListQuestions,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
} from '../controllers/question.controller';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

// ---- 校验 schema ----
const practiceSchema = z.object({
  userAnswer: z.string().min(1, '请填写你的回答').max(10000),
  timeSpent: z.number().int().min(0).max(86400).optional(),
  userNotes: z.string().max(2000).optional(),
});

const createQuestionSchema = z.object({
  type: z.string().min(1, '题型不能为空'),
  subtype: z.string().optional(),
  content: z.string().min(1, '题目内容不能为空'),
  thinkingProcess: z.any().optional(),
  modelAnswer: z.string().optional(),
  scoringPoints: z.any().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  tags: z.any().optional(),
  sourceYear: z.number().int().optional(),
  sourceRegion: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

const updateQuestionSchema = z.object({
  type: z.string().optional(),
  subtype: z.string().optional(),
  content: z.string().optional(),
  thinkingProcess: z.any().optional(),
  modelAnswer: z.string().optional(),
  scoringPoints: z.any().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  tags: z.any().optional(),
  sourceYear: z.number().int().optional(),
  sourceRegion: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

/**
 * 公共题库路由
 * GET  /api/questions            题目列表（分页+筛选）
 * GET  /api/questions/types      题型分类树
 * GET  /api/questions/:id        题目详情
 * POST /api/questions/:id/favorite   收藏/取消（需登录）
 * POST /api/questions/:id/practice   提交练习（需登录）
 */
const publicRouter = Router();
publicRouter.get('/', optionalAuth, listQuestions);
publicRouter.get('/types', getTypes);
publicRouter.get('/:id', optionalAuth, getQuestion);
publicRouter.post('/:id/favorite', requireAuth, toggleFavorite);
publicRouter.post('/:id/practice', requireAuth, validate(practiceSchema), submitPractice);
publicRouter.get('/:id/notes', requireAuth, getNotes);
publicRouter.put('/:id/notes', requireAuth, saveNotes);

/**
 * 管理员题库路由（全部需要 requireAuth + requireAdmin）
 * GET    /api/admin/questions           题目管理列表
 * GET    /api/admin/questions/template  下载导入模板（TODO）
 * POST   /api/admin/questions           新增题目
 * POST   /api/admin/questions/import    批量导入（TODO）
 * PUT    /api/admin/questions/:id       编辑题目
 * DELETE /api/admin/questions/:id       删除题目
 */
const adminRouter = Router();
adminRouter.get('/', requireAuth, requireAdmin, adminListQuestions);
adminRouter.post('/', requireAuth, requireAdmin, validate(createQuestionSchema), adminCreateQuestion);
adminRouter.put('/:id', requireAuth, requireAdmin, validate(updateQuestionSchema), adminUpdateQuestion);
adminRouter.delete('/:id', requireAuth, requireAdmin, adminDeleteQuestion);

export { publicRouter as questionPublicRouter, adminRouter as questionAdminRouter };
