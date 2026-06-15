import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { errorHandler, NotFoundError } from './utils/api';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import { questionPublicRouter, questionAdminRouter } from './routes/questions';
import examsRouter from './routes/exams';
import userRouter from './routes/user';
import aiRouter from './routes/ai';
import adminRouter from './routes/admin';

const app = express();

// ---- 基础中间件 ----
app.use(helmet()); // 安全 HTTP 头
app.use(
  cors({
    origin: config.clientUrl === '*' ? true : config.clientUrl,
    credentials: true, // 允许携带 Cookie（用于 JWT 刷新等）
  }),
);
app.use(express.json({ limit: '2mb' })); // JSON body（含较长的答题文本）
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(config.isDev ? 'dev' : 'combined')); // 访问日志

// 全局速率限制（防止滥用）
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    limit: 1000, // 每个 IP 最多 1000 次请求
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ---- 路由 ----
app.get('/', (_req, res) => {
  res.json({
    name: '公务员面试训练平台 API',
    version: '0.1.0',
    docs: '/api/health',
  });
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/questions', questionPublicRouter);
app.use('/api/admin/questions', questionAdminRouter);
app.use('/api/exams', examsRouter);
app.use('/api/user', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);

// 404 —— 放在所有路由之后
app.use((_req, _res, next) => next(new NotFoundError('接口不存在')));

// 全局错误处理 —— 必须放最后
app.use(errorHandler);

export default app;
