import type { Request, Response, NextFunction } from 'express';
import { extractBearerToken, verifyToken, type TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/api';

/**
 * 扩展 Express Request，附加当前用户信息。
 */
declare global {
  namespace Express {
    interface Request {
      currentUser?: TokenPayload;
    }
  }
}

/**
 * 必需认证中间件：从 Authorization header 提取 Bearer token 并验证。
 * 验证通过后，将 payload 写入 `req.currentUser`。
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return next(new UnauthorizedError('Token 不存在'));
  }
  const payload = verifyToken(token);
  if (!payload) {
    return next(new UnauthorizedError('Token 无效或已过期'));
  }
  req.currentUser = payload;
  next();
}

/**
 * 可选认证中间件：如果提供了有效 token 则附加用户信息，否则继续（不报错）。
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.currentUser = payload;
    }
  }
  next();
}

/**
 * 管理员验证中间件：必须在 requireAuth 之后使用。
 * 要求 currentUser.role === 'admin'。
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return next(new UnauthorizedError('需要先登录'));
  }
  if (req.currentUser.role !== 'admin') {
    return next(new ForbiddenError('仅管理员可执行此操作'));
  }
  next();
}
