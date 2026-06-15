# 🆓 一键免费部署（Render.com）

全程 **一个平台**，约 15 分钟。

---

## 第一步：注册（2分钟）

打开 [render.com](https://render.com) → 用 GitHub 账号注册登录

---

## 第二步：上传代码（3分钟）

把你的项目文件夹上传到 GitHub：

```bash
# 在项目根目录
git init
git add .
git commit -m "初始版本"
git branch -M main

# 在 GitHub 创建新仓库 → 然后：
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

---

## 第三步：一键部署（10分钟）

在 Render 后台：

1. 点右上角 **New +** → **Blueprint**
2. 连接你的 GitHub 仓库
3. Render 自动读取 `render.yaml` 配置
4. 点 **Apply** — 等待 8-10 分钟自动部署完成

---

## 🎉 完成！

部署成功后，Render 会给你两个地址：

| 服务 | 地址 |
|------|------|
| 前端 | `https://civil-interview-frontend.onrender.com` |
| 后端 | `https://civil-interview-backend.onrender.com` |

打开前端地址就能用了！

测试账号：`admin@example.com` / `admin123`

---

## 免费额度

| 项目 | 免费额度 |
|------|---------|
| 后端 | 750小时/月（刚好够一个月） |
| 前端 | 100GB/月流量 |
| 存储 | 1GB 持久磁盘 |

> 如果访问慢，是因为 Render 免费机器在休眠后需要 30 秒唤醒，之后正常使用。
