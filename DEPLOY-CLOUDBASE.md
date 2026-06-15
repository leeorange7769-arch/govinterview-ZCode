# 腾讯云 CloudBase 部署指南

## 前置条件
- 腾讯云账号（微信扫码注册即可）
- 开通 CloudBase（云开发）

---

## 第一步：开通环境（2分钟）

1. 打开 https://console.cloud.tencent.com/tcb
2. 点击「新建环境」→ 环境名称随意 → 选择「按量计费」（有免费额度）
3. 等 2 分钟环境创建完毕，记下 **环境 ID**（形如 `xxx-abc123`）

---

## 第二步：部署前端（3分钟）

1. CloudBase 控制台 → 左侧「静态网站托管」
2. 点「开通」→ 上传文件夹 → 选择 `frontend/dist` 目录
3. 默认域名就是你的网站地址

> 如果 dist 还没构建，先在本地执行：`cd frontend && npm run build`

---

## 第三步：部署后端（5分钟）

使用云托管（容器模式，完整运行 Express）：

1. CloudBase 控制台 → 左侧「云托管」
2. 新建服务 → 名称 `civil-backend`
3. 选择「使用 Dockerfile」→ 上传 `backend` 目录
4. 环境变量设置：
   - `NODE_ENV` = `production`
   - `PORT` = `4000`
   - `JWT_SECRET` = （随便设一个复杂密码）
   - `CLIENT_URL` = `*`
   - `DATABASE_URL` = `file:./data/dev.db`
5. 部署

---

## 第四步：连起来

1. 云托管部署后会给你一个后端地址，形如 `https://xxx.ap-shanghai.tcb.run`
2. 打开 `frontend/src/api/client.ts`
3. 把 `const API_BASE = ...` 改成：`const API_BASE = 'https://你的后端地址/api'`
4. 重新构建前端：`cd frontend && npm run build`
5. 重新上传前端到静态托管

---

## 免费额度

| 资源 | 免费额度/月 |
|------|-----------|
| 静态托管存储 | 5GB |
| 静态托管流量 | 5GB |
| 云托管 CPU | 有免费额度 |
| 云托管内存 | 有免费额度 |

首次开通一般送 1-3 个月免费资源包。
