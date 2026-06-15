import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/api';

/**
 * 请求体验证中间件工厂。
 * 使用 Zod schema 校验 `req.body`，失败时抛出 400 错误。
 *
 * 额外校验目标字段（如 `req.query` / `req.params`）可组合使用。
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // 用 sanitized 数据替换
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        return next(new BadRequestError(messages.join('; ')));
      }
      next(err);
    }
  };
}

/**
 * 快捷函数：从查询参数中获取分页参数。
 */
export function getPagination(
  query: { page?: string; limit?: string },
  maxLimit = 100,
): { skip: number; take: number } {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
  return { skip: (page - 1) * limit, take: limit };
}
