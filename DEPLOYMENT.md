# Stock Sentinel 部署指南

## 📋 目录
- [方案 1：Vercel 部署（推荐）](#方案-1vercel-部署推荐)
- [方案 2：腾讯云 CloudBase 云托管](#方案-2腾讯云-cloudbase-云托管)
- [方案 3：其他平台](#方案-3其他平台)

---

## 方案 1：Vercel 部署（推荐）

### 优势
- ✅ 完全免费（Hobby 计划）
- ✅ Next.js 原生支持，零配置
- ✅ 自动 HTTPS + 全球 CDN
- ✅ Git 集成，推送即部署
- ✅ 无限带宽

### 部署步骤

#### 方式 A：通过 Vercel Dashboard（最简单）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub/GitLab/Bitbucket 登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 Git 仓库（需要先推送到 GitHub）
   - 或者选择 "Import Git Repository"

3. **配置环境变量**
   - 在 "Environment Variables" 部分添加：
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://nflxhlfoeotwflofxhxg.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key
     ```

4. **部署**
   - 点击 "Deploy"
   - 等待 2-3 分钟
   - 获得部署 URL：`https://your-project.vercel.app`

#### 方式 B：通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 进入项目目录
cd d:\CustomProjects\SS\stock-sentinel

# 4. 部署
vercel

# 5. 按提示操作
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No
# - What's your project's name? stock-sentinel
# - In which directory is your code located? ./

# 6. 添加环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 7. 重新部署
vercel --prod
```

### 自定义域名（可选）

1. 在 Vercel Dashboard 中选择项目
2. 进入 "Settings" → "Domains"
3. 添加你的域名
4. 按提示配置 DNS 记录

---

## 方案 2：腾讯云 CloudBase 云托管

### 资源需求评估

**DAU=2 的消耗：**
- CPU：0.1 核（峰值）
- 内存：256 MB
- 流量：~3 GB/月
- 请求：~6000 次/月

**CloudBase 免费额度：**
- ✅ CPU：0.25 核（够用）
- ✅ 内存：0.5 GB（够用）
- ⚠️ 流量：1 GB/月（需要购买流量包，约 ¥10/月）
- ✅ 请求：10 万次/月（绰绰有余）

**预估成本：** ¥10-20/月（主要是流量费用）

### 部署步骤

#### 1. 准备工作

确保已安装：
- Docker Desktop
- 腾讯云 CLI（可选）

#### 2. 构建 Docker 镜像

```bash
# 进入项目目录
cd d:\CustomProjects\SS\stock-sentinel

# 构建镜像
docker build -t stock-sentinel:latest .

# 测试镜像（可选）
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=你的URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=你的KEY \
  stock-sentinel:latest
```

#### 3. 推送到腾讯云容器镜像服务

```bash
# 1. 登录腾讯云容器镜像服务
docker login ccr.ccs.tencentyun.com --username=你的账号

# 2. 标记镜像
docker tag stock-sentinel:latest ccr.ccs.tencentyun.com/你的命名空间/stock-sentinel:latest

# 3. 推送镜像
docker push ccr.ccs.tencentyun.com/你的命名空间/stock-sentinel:latest
```

#### 4. 在 CloudBase 控制台部署

1. **访问 CloudBase 控制台**
   - https://console.cloud.tencent.com/tcb

2. **创建云托管服务**
   - 选择你的环境
   - 进入 "云托管" → "新建服务"
   - 服务名称：`stock-sentinel`

3. **配置服务**
   - 镜像：选择刚才推送的镜像
   - 端口：`3000`
   - CPU：0.25 核
   - 内存：0.5 GB
   - 实例数：1

4. **配置环境变量**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://nflxhlfoeotwflofxhxg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key
   ```

5. **部署**
   - 点击 "部署"
   - 等待 5-10 分钟
   - 获得访问地址

#### 5. 配置自定义域名（可选）

1. 在云托管服务中选择 "域名管理"
2. 添加自定义域名
3. 配置 CNAME 记录

---

## 方案 3：其他平台

### Railway（推荐备选）

**优势：**
- ✅ 每月 $5 免费额度
- ✅ 支持 GitHub 自动部署
- ✅ 简单易用

**部署：**
1. 访问 https://railway.app
2. 连接 GitHub 仓库
3. 添加环境变量
4. 自动部署

### Render

**优势：**
- ✅ 免费套餐（有限制）
- ✅ 自动 HTTPS
- ✅ 支持 Docker

**限制：**
- ⚠️ 15 分钟无活动会休眠
- ⚠️ 冷启动较慢

### Netlify

**优势：**
- ✅ 免费套餐
- ✅ 全球 CDN

**限制：**
- ⚠️ 无服务器函数有限制
- ⚠️ 构建时间限制

---

## 🎯 推荐选择

### 个人使用（DAU=2）

**首选：Vercel** 🏆
- 理由：完全免费，性能最佳，零配置

**备选：Railway**
- 理由：$5/月免费额度足够使用

### 如果必须用腾讯云

**CloudBase 云托管**
- 成本：¥10-20/月
- 优势：国内访问速度快
- 劣势：需要额外配置，有一定成本

---

## 📊 成本对比

| 平台 | 月成本 | 流量限制 | 请求限制 | 推荐度 |
|------|--------|----------|----------|--------|
| Vercel | ¥0 | 无限 | 100 GB-hours | ⭐⭐⭐⭐⭐ |
| Railway | ¥0 ($5 额度) | 100 GB | 无限 | ⭐⭐⭐⭐ |
| CloudBase | ¥10-20 | 需购买 | 10万次 | ⭐⭐⭐ |
| Render | ¥0 | 100 GB | 有限 | ⭐⭐ |

---

## 🔧 部署后配置

### 1. 更新 Supabase 重定向 URL

在 Supabase Dashboard 中：
1. 进入 Authentication → URL Configuration
2. 添加你的部署 URL 到 "Site URL"
3. 添加到 "Redirect URLs"：
   ```
   https://your-domain.vercel.app/auth/callback
   ```

### 2. 测试部署

访问你的部署 URL，测试：
- ✅ 登录/注册功能
- ✅ Dashboard 数据加载
- ✅ 自选管理功能
- ✅ 个股详情页

---

## 🐛 常见问题

### Q: 部署后环境变量不生效？
A: 确保环境变量名称正确，并且重新部署。

### Q: Vercel 部署失败？
A: 检查 `next.config.ts` 配置，确保没有语法错误。

### Q: CloudBase 冷启动慢？
A: 可以配置定时任务保持实例活跃，或升级到更高配置。

### Q: 如何查看部署日志？
A: 
- Vercel: Dashboard → Deployments → 选择部署 → Logs
- CloudBase: 云托管 → 服务详情 → 日志

---

## 📞 需要帮助？

如果部署遇到问题，请检查：
1. 环境变量是否正确配置
2. Supabase URL 是否可访问
3. 构建日志中的错误信息
