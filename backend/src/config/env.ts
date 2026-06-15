import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量（显式指向 backend/.env，兼容从根目录或子树启动）
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 如果上述路径未找到（例如已构建到 dist），回退到 CWD
if (!process.env.JWT_SECRET) {
  dotenv.config();
}

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`环境变量 ${key} 未设置，请在 backend/.env 中配置`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  port: Number(process.env.PORT ?? 4000),

  // 数据库
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),

  // JWT
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  // OpenAI（Step 7 使用）
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },

  // 跨域
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
} as const;

export type Config = typeof config;
