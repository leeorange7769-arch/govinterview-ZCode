import { Router } from 'express';
import { z } from 'zod';
import { listUsers, updateUser, getStats } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const updateUserSchema = z.object({
  status: z.enum(['active', 'inactive', 'banned']).optional(),
  role: z.enum(['admin', 'user']).optional(),
});

const router = Router();

// 全部需要管理员权限
router.get('/users', requireAuth, requireAdmin, listUsers);
router.put('/users/:id', requireAuth, requireAdmin, validate(updateUserSchema), updateUser);
router.get('/stats', requireAuth, requireAdmin, getStats);

export default router;
