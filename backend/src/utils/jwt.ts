import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

type JwtType = 'access' | 'refresh';

/**
 * 解析 Bearer token（Authorization header）。
 * 返回原始 token 字符串，若缺失或格式不对返回 null。
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
}

/**
 * 签发 JWT。
 */
export function signToken(payload: TokenPayload, type: JwtType = 'access'): string {
  const expiresIn = type === 'access' ? config.jwtExpiresIn : '30d';
  return jwt.sign(payload, config.jwtSecret, { expiresIn } as jwt.SignOptions);
}

/**
 * 验证 JWT，返回解码后的 payload。
 * 失败返回 null。
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload & jwt.JwtPayload;
    return { userId: payload.userId, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
