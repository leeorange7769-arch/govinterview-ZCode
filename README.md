# 公务员面试训练平台

一个前后端分离的全栈应用，帮助公务员面试备考：智能题库、模拟考试、AI 评分与薄弱板块分析、学习进度跟踪、管理员后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts + Zustand + React Query |
| 后端 | Node.js + Express + TypeScript + Prisma + JWT |
| 数据库 | 开发：SQLite（Prisma 一行切换）｜ 生产：PostgreSQL + Redis |
| AI | OpenAI API（智能评分、薄弱板块分析） |
| 部署 | Docker + Nginx |

## 项目结构

```
civil-service-interview/
├── package.json          # monorepo 根（npm workspaces）
├── .env.example
├── frontend/             # React 前端
└── backend/              # Express 后端
    ├── src/
    │   ├── config/       # 配置加载
    │   ├── routes/       # 路由
    │   ├── controllers/  # 控制器
    │   ├── services/     # 业务逻辑
    │   ├── middleware/   # 中间件（auth、error、validate）
    │   ├── utils/        # 工具函数
    │   └── app.ts        # Express 应用
    └── prisma/
        └── schema.prisma # 数据库模型
```

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动后端（默认 http://localhost:4000）
npm run dev:backend

# 3. 启动前端（默认 http://localhost:5173）
npm run dev:frontend
```

### Docker 一键部署

```bash
# 构建并启动（前端 80 端口 + 后端 4000 端口）
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

部署后访问 **http://localhost** 即可使用完整平台。

---

## 🌍 部署到公网（让任何人都能访问）

### 前提条件
- 一台云服务器（阿里云/腾讯云轻量服务器，最低 2核2G，约 ¥68/月）
- 一个域名（可选，约 ¥30/年）
- 服务器需安装：Docker + Docker Compose

### 第一步：在服务器上安装 Docker

```bash
# Ubuntu/Debian 一键安装
curl -fsSL https://get.docker.com | bash

# 安装 Docker Compose 插件
apt install docker-compose-plugin -y
```

### 第二步：上传项目到服务器

```bash
# 在服务器上克隆或上传项目
git clone <你的仓库地址> civil-interview
cd civil-interview
```

### 第三步：配置生产环境变量

```bash
# 复制生产环境配置
cp .env.production backend/.env.production

# ⚠️ 修改 backend/.env.production：
#   1. 生成强随机 JWT_SECRET
#   2. 修改数据库密码
#   3. （可选）填入 OPENAI_API_KEY
```

生成安全密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 把输出复制到 JWT_SECRET
```

### 第四步：启动服务

```bash
# 无 SSL 版本（仅 HTTP，先测试能不能跑）
docker compose -f docker-compose.yml up -d --build

# 然后访问 http://你的服务器IP 应该能看到网站
```

### 第五步（可选）：配置域名 + 免费 SSL

```bash
# 1. 在域名 DNS 添加 A 记录指向服务器 IP

# 2. 安装 certbot 获取免费 SSL 证书
apt install certbot -y
certbot certonly --standalone -d your-domain.com

# 3. 复制证书
mkdir -p ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/

# 4. 修改 frontend/nginx.prod.conf 中的域名

# 5. 用生产版 compose 启动（带 HTTPS）
docker compose -f docker-compose.prod.yml up -d --build
```

### 日常维护

```bash
# 查看日志
docker compose -f docker-compose.prod.yml logs -f

# 更新代码后重新部署
git pull
docker compose -f docker-compose.prod.yml up -d --build

# 数据库备份
docker exec civil-db pg_dump -U postgres civil_interview > backup.sql
```

> 首次启动会自动执行数据库迁移。SQLite 数据文件通过 named volume `backend-data` 持久化，容器重建不会丢失数据。

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | `admin@example.com` | `admin123` |
| 普通用户 | `user@example.com` | `user123` |

> ⚠️ 生产环境请务必修改 `backend/.env` 中的 `JWT_SECRET` 和默认账号密码。

## 开发路线图（分阶段）

- [x] **Step 1** — Monorepo 结构与配置
- [ ] **Step 2** — 后端骨架（Express + TS，能启动 + 健康检查）
- [ ] **Step 3** — 数据库 Schema（Prisma）
- [ ] **Step 4** — 认证模块（注册 / 登录 / JWT）
- [ ] **Step 5** — 题库模块 API
- [ ] **Step 6** — 考试与训练记录模块 API
- [ ] **Step 7** — AI 评分与分析模块
- [ ] **Step 8** — 前端骨架
- [ ] **Step 9** — 前端页面实现
- [ ] **Step 10** — 管理员后台
- [ ] **Step 11** — 部署配置（Docker + Nginx）

> 详细需求见桌面原始需求文档。
