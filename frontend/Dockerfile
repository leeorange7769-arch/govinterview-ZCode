# ============================================
# 前端 Dockerfile（多阶段：Vite 构建 → Nginx 托管）
# ============================================

# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖（含 devDependencies 用于构建）
COPY package.json package-lock.json* ./
RUN npm ci

# 复制源码
COPY . .

# Vite 构建（输出到 dist/）
RUN npm run build

# ---- 运行阶段 ----
FROM nginx:1.27-alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 健康检查
RUN apk add --no-cache curl

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
