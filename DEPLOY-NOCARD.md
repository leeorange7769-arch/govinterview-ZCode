# 🆓 零绑卡免费部署：Netlify + Glitch

两个平台都不需要信用卡，完全免费，约 20 分钟搞定。

---

## 架构

```
用户浏览器
    │
    ▼
┌──────────────────────┐
│ Netlify               │  免费托管前端
│ xxx.netlify.app       │  100GB/月流量
└──────┬───────────────┘
       │ /api/*
       ▼
┌──────────────────────┐
│ Glitch                │  免费运行后端
│ xxx.glitch.me         │  Node.js + SQLite
│                       │  项目休眠会自唤醒
└──────────────────────┘
```

---

## 第一步：部署后端到 Glitch（10分钟）

### 1.1 创建 Glitch 账号
打开 https://glitch.com → 右上角 Sign in → 用 GitHub 登录

### 1.2 导入项目
1. 右上角 **New project** → **Import from GitHub**
2. 粘贴你的仓库地址：`https://github.com/leeorange7769-arch/govinterview-ZCode`
3. 等 Glitch 自动安装依赖

### 1.3 修改启动配置
在 Glitch 项目中找到 `package.json`，把 `scripts.start` 改为：
```
cd backend && npx prisma generate && npx prisma migrate deploy && npx tsx prisma/seed.ts && npx tsx src/server.ts
```

### 1.4 设置环境变量
Glitch 左侧 → 点项目名 → **.env** 文件，确认：
```
PORT=4000
DATABASE_URL=file:./data/dev.db
JWT_SECRET=随便改一个你的密码
JWT_EXPIRES_IN=7d
CLIENT_URL=*
```

### 1.5 让项目保持唤醒
Glitch 免费项目 5 分钟不用会休眠，用这个服务保持唤醒：
- 打开 https://uptimerobot.com
- 免费注册 → Add New Monitor → URL 填 `https://你的项目.glitch.me/api/health`
- 每 5 分钟会自动访问一次，保持项目不睡

### 1.6 记下你的后端地址
Glitch 会给你一个地址：`https://xxx.glitch.me`（在顶部显示）

---

## 第二步：部署前端到 Netlify（5分钟）

### 2.1 修改 netlify.toml
打开 GitHub 上的 `netlify.toml`，把 `YOUR-GLITCH-PROJECT` 改成你的 Glitch 项目名。

例如 Glitch 地址是 `https://shiny-star.glitch.me`，就改成：
```
to = "https://shiny-star.glitch.me/api/:splat"
```

### 2.2 部署
1. 打开 https://app.netlify.com → 用 GitHub 登录
2. 点 **Add new site** → **Import an existing project** → 连接 GitHub
3. 选你的仓库 → 部署
4. Netlify 自动检测 `netlify.toml` 并构建

部署完 Netlify 会给你一个地址：`https://xxx.netlify.app`

---

## 🎉 完成！

打开 Netlify 给的地址就能用了！

测试账号：`admin@example.com` / `admin123`

---

## 免费额度

| 平台 | 免费额度 | 够用吗 |
|------|---------|--------|
| Netlify | 100GB/月流量，300分钟构建 | ✅ 很充裕 |
| Glitch | 1000小时/月，512MB 存储 | ✅ 需要 UptimeRobot 防休眠 |
| UptimeRobot | 免费监控 5 分钟一次 | ✅ 正好用来唤醒 Glitch |
