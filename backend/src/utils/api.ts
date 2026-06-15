import type { Request, Response, NextFunction } from 'express';

/**
 * 统一 API 响应格式：
 * { success: true, data: ... } | { success: false, error: { code, message } }
 */
export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

/**
 * 业务错误基类。携带 HTTP 状态码与错误码，便于全局错误处理中间件统一转换。
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 400 */
export class BadRequestError extends ApiError {
  constructor(message = '请求参数有误', code = 'BAD_REQUEST') {
    super(400, message, code);
  }
}

/** 401 */
export class UnauthorizedError extends ApiError {
  constructor(message = '未登录或登录已过期', code = 'UNAUTHORIZED') {
    super(401, message, code);
  }
}

/** 403 */
export class ForbiddenError extends ApiError {
  constructor(message = '没有权限执行此操作', code = 'FORBIDDEN') {
    super(403, message, code);
  }
}

/** 404 */
export class NotFoundError extends ApiError {
  constructor(message = '资源不存在', code = 'NOT_FOUND') {
    super(404, message, code);
  }
}

/**
 * 全局错误处理中间件（必须是 4 个参数，Express 才能识别）。
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code ?? 'ERROR', message: err.message },
    });
  }

  // 未知错误：开发期输出堆栈，生产期隐藏
  console.error('[未处理错误]', err);
  const message =
    process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err instanceof Error
        ? err.message
        : '未知错误';
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message },
  });
}

/**
 * 包装异步路由处理器，自动捕获 Promise 拒绝并交给错误中间件。
 * 用法：router.get('/x', wrap(async (req, res) => { ... }))
 */
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function wrap(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
