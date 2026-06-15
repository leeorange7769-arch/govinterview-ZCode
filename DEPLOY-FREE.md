# 🆓 免费部署教程：Firebase + Cloud Run + Supabase

全程免费，需要约 30 分钟，一个 Google 账号 + 一个 GitHub 账号。

---

## 架构说明

```
用户浏览器
    │
    ▼
┌──────────────────────┐
│ Firebase Hosting      │  免费托管前端静态文件
│ (your-project.web.app)│
└──────┬───────────────┘
       │ API 请求
       ▼
┌──────────────────────┐
│ Cloud Run             │  免费运行后端 Express API
│ (civil-backend-xxx.a.run.app) │  200万次/月免费
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Supabase              │  免费 PostgreSQL 数据库
│ (db.xxx.supabase.co)  │  500MB 免费
└──────────────────────┘
```

---

## 第一步：注册账号（5分钟）

1. 打开 [console.firebase.google.com](https://console.firebase.google.com) → 用 Google 账号登录 → 创建项目（名称随意）
2. 打开 [console.cloud.google.com](https://console.cloud.google.com) → 同一个 Google 账号 → 启用 Cloud Run API
3. 打开 [supabase.com](https://supabase.com) → 用 GitHub 账号注册 → 创建项目 → 设置数据库密码（记住！）

---

## 第二步：获取数据库连接信息（3分钟）

在 Supabase 后台：
- Settings → Database → Connection string → 选 **URI** → 复制
- 格式：`postgresql://postgres:[密码]@db.[项目ID].supabase.co:5432/postgres`

```
# 编辑 .env.cloud，把复制的连接字符串填入：
DATABASE_URL="postgresql://postgres:你的密码@db.xxx.supabase.co:5432/postgres"

# 生成 JWT 密钥（在终端执行）：
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 把输出填入 JWT_SECRET
```

---

## 第三步：安装工具（5分钟）

在你的电脑上（Windows）：

```bash
# 1. 安装 Firebase CLI
npm install -g firebase-tools

# 2. 登录
firebase login

# 3. 安装 Google Cloud CLI  
# 下载安装：https://cloud.google.com/sdk/docs/install
# 安装后：
gcloud auth login
gcloud config set project [你的Firebase项目ID]
```

---

## 第四步：部署后端到 Cloud Run（10分钟）

```bash
# 在项目根目录

# 1. 构建 Docker 镜像并推送到 Google 容器仓库
gcloud builds submit --tag gcr.io/[项目ID]/civil-backend

# 2. 部署到 Cloud Run
gcloud run deploy civil-backend \
  --image gcr.io/[项目ID]/civil-backend \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars-file=.env.cloud \
  --memory 512Mi \
  --cpu 1

# 部署成功后会显示一个 URL，如：
# https://civil-backend-xxxxx.asia-east1.run.app
# ⚠️ 记下这个 URL！
```

---

## 第五步：配置前端 API 地址（2分钟）

拿到 Cloud Run URL 后，创建前端环境文件：

```bash
# 在 frontend/ 目录创建 .env.production
echo "VITE_API_URL=https://civil-backend-xxxxx.asia-east1.run.app/api" > frontend/.env.production
```

---

## 第六步：部署前端到 Firebase（5分钟）

```bash
# 在项目根目录

# 1. 初始化 Firebase（只需一次）
firebase init hosting

# 交互式问答时：
#   ? What do you want to use as your public directory?   frontend/dist
#   ? Configure as a single-page app?                    Yes
#   ? Set up automatic builds with GitHub?               No

# 2. 构建前端
cd frontend && npm run build && cd ..

# 3. 部署
firebase deploy --only hosting

# 部署成功后会显示：
# ✔ Deploy complete!
# Hosting URL: https://你的项目ID.web.app
```

---

## 第七步：去 Supabase 初始化数据库（3分钟）

Supabase → SQL Editor → 执行以下 SQL 来创建表（或者直接用 Prisma 推送）：

```bash
# 在本地项目根目录执行（需要先安装 Prisma CLI）
cd backend

# 把 .env.cloud 改成 .env 让 Prisma 连接 Supabase
copy .env.cloud .env

# 推送数据库表结构
npx prisma migrate deploy

# 插入种子数据（管理员 + 示例题目）
npx tsx prisma/seed.ts
```

---

## 🎉 完成！

打开浏览器访问：**https://你的项目ID.web.app**

测试账号：`admin@example.com` / `admin123`

---

## 免费额度一览

| 服务 | 免费额度 | 够用吗 |
|------|---------|--------|
| Firebase Hosting | 10GB 存储 / 360MB 日流量 | ✅ 小站足够 |
| Cloud Run | 200万次请求/月 | ✅ 日均6万次 |
| Supabase | 500MB 数据库 | ✅ 百万条题目绰绰有余 |

## 有域名的话（可选）

Firebase Hosting → 添加自定义域名 → DNS 加一条 A 记录 → 自动获取 SSL 证书，全程免费。
