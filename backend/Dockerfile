# ============================================
# 后端 Dockerfile（生产级：TS 编译 + 自动迁移）
# ============================================

# ---- 构建阶段：编译 TypeScript ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# 生成 Prisma Client + 编译 TS
RUN npx prisma generate && \
    npx tsc -p tsconfig.json

# 清理 devDependencies，只保留生产依赖
RUN npm prune --omit=dev

# ---- 运行阶段 ----
FROM node:20-alpine

WORKDIR /app

# 从构建阶段复制
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# 工具
RUN apk add --no-cache curl

# 复制入口脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 创建数据目录（SQLite 持久化）
RUN mkdir -p /app/data

EXPOSE 4000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
