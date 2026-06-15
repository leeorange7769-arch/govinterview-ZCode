import app from './app';
import { config } from './config/env';

const server = app.listen(config.port, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${config.port}`);
  console.log(`   环境: ${config.env}`);
  console.log(`   健康检查: http://localhost:${config.port}/api/health`);
});

// 优雅关闭
const shutdown = (signal: string) => {
  console.log(`\n收到 ${signal}，正在关闭服务器...`);
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 未捕获异常兜底
process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
