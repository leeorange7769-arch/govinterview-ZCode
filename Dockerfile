# CloudBase 云托管 Dockerfile（根目录入口）
# 实际构建在 backend/ 目录

FROM node:20-alpine

WORKDIR /app

# 复制后端代码
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/.env ./

RUN npx tsc --outDir dist || true

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/server.ts"]
