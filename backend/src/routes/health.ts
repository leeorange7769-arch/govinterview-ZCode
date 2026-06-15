import { Router } from 'express';
import { ok } from '../utils/api';

const router = Router();

/**
 * 健康检查端点。
 * 用于 Docker / Nginx / 监控探活。
 */
router.get('/', (_req, res) => {
  ok(res, {
    status: 'ok',
    service: 'civil-service-interview-api',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

export default router;
