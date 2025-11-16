# Vercel 部署完整指南

## 📦 准备工作

### 1. 获取 LongCat Cookie

访问 https://longcat.chat 并登录账号

打开浏览器开发者工具（F12）：
```
Application/应用 → Storage/存储 → Cookies 
→ https://longcat.chat 
→ 复制 passport_token_key 的值
```

---

## 🚀 部署方式

### 方式1：Vercel CLI（3 步完成）⭐

**1. 安装 Vercel CLI**
```bash
npm install -g vercel
```

**2. 登录 Vercel**
```bash
vercel login
```
浏览器会打开，选择登录方式（GitHub/GitLab/Bitbucket/Email）

**3. 部署项目**
```bash
cd c:\Users\26092\Desktop\longchat\vercel
vercel --prod
```

部署过程中的问题：
- **Set up and deploy?** → `Yes`
- **Which scope?** → 选择你的账号
- **Link to existing project?** → `No`
- **Project name?** → `longcat-2api`（或自定义）
- **In which directory?** → `./`（回车）
- **Override settings?** → `No`（回车）

完成后会显示：
```
✅ Production: https://longcat-2api.vercel.app
```

---

### 方式2：GitHub 自动部署

**1. 创建 Git 仓库**
```bash
cd c:\Users\26092\Desktop\longchat\vercel
git init
git add .
git commit -m "Initial commit: LongCat 2API Vercel"
```

**2. 推送到 GitHub**
```bash
# 在 GitHub 创建新仓库后
git remote add origin https://github.com/你的用户名/longcat-2api.git
git branch -M main
git push -u origin main
```

**3. 在 Vercel 导入项目**
- 访问 https://vercel.com/new
- 点击 **Import Git Repository**
- 选择你刚创建的仓库
- **Root Directory**: 保持默认 `./`
- 点击 **Deploy**

**好处**：
- ✅ 每次 `git push` 自动部署
- ✅ 预览部署（PR/分支）
- ✅ 版本管理

---

### 方式3：拖拽上传

**1. 打包文件夹**
- 将 `vercel` 文件夹压缩为 ZIP（可选）

**2. 上传到 Vercel**
- 访问 https://vercel.com/new
- 拖拽 `vercel` 文件夹到页面
- 等待上传和分析
- 点击 **Deploy**

---

## ✅ 部署成功验证

部署完成后，测试你的 API：

### 1. 测试模型列表
```bash
curl https://your-project.vercel.app/v1/models
```

应返回：
```json
{
  "object": "list",
  "data": [
    {"id": "LongCat", "object": "model", ...},
    {"id": "LongCat-Search-ShowLinks", "object": "model", ...}
  ]
}
```

### 2. 测试聊天接口
```bash
curl https://your-project.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASSPORT_TOKEN_KEY" \
  -d '{
    "model": "LongCat",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": false
  }'
```

---

## 🌐 配置自定义域名

### 1. 添加域名

Vercel Dashboard：
```
你的项目 → Settings → Domains → Add Domain
```

输入你的域名：`api.yourdomain.com`

### 2. 配置 DNS

在你的域名服务商（如 Cloudflare/阿里云）添加 CNAME 记录：

```
类型: CNAME
名称: api
目标: cname.vercel-dns.com
```

### 3. 等待生效

通常几分钟到几小时，Vercel 会自动配置 SSL 证书

---

## 🛠️ 本地开发

### 安装依赖
```bash
cd vercel
npm install
```

### 启动本地服务器
```bash
vercel dev
```

访问 `http://localhost:3000`：
```bash
curl http://localhost:3000/v1/models
```

---

## 🔄 更新部署

### CLI 更新
```bash
# 修改代码后
vercel --prod
```

### Git 更新（如果已连接 GitHub）
```bash
git add .
git commit -m "Update API"
git push
```
Vercel 会自动检测并重新部署

---

## 📊 查看日志和监控

### 实时日志
```bash
vercel logs
```

### Dashboard 查看
```
Vercel Dashboard 
→ 你的项目 
→ Deployments 
→ 点击某次部署 
→ Functions 
→ 选择函数 
→ Logs
```

---

## 🔐 环境变量（可选）

如需配置环境变量：

### 通过 Dashboard
```
Settings → Environment Variables → Add
```

添加：
```
Name: API_BASEURL
Value: https://longcat.chat
```

### 通过 CLI
```bash
vercel env add API_BASEURL
```

在代码中使用：
```javascript
const baseUrl = process.env.API_BASEURL || 'https://longcat.chat';
```

---

## ⚙️ 高级配置

### 调整函数超时（Pro 计划）

编辑 `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

### 配置缓存
```json
{
  "headers": [
    {
      "source": "/v1/models",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

---

## 🐛 常见问题

### 问题1：部署失败 - "No Build Output"

**原因**：Vercel 找不到可部署的内容

**解决**：
- 确保 `vercel.json` 在根目录
- 确保 `api/` 文件夹存在
- 检查文件路径是否正确

### 问题2：函数超时

**原因**：免费计划限制 10 秒

**解决**：
- 升级到 Pro 计划（60 秒）
- 优化请求逻辑
- 使用非流式响应

### 问题3：CORS 错误

**原因**：跨域配置问题

**解决**：
已在 `vercel.json` 配置 CORS，如仍有问题：
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### 问题4：模块导入错误

**原因**：Node.js 版本或 ESM 配置

**解决**：
确保 `package.json` 中有：
```json
{
  "type": "module"
}
```

---

## 📈 性能优化

### 1. 启用边缘函数（Pro）
```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "edge"
    }
  }
}
```

### 2. 区域配置
```json
{
  "regions": ["iad1", "hkg1"]
}
```

---

## 🎯 生产环境检查清单

部署前确认：
- ✅ 测试过所有 API 端点
- ✅ 验证过流式和非流式响应
- ✅ 测试过所有模型
- ✅ 配置了合适的 CORS
- ✅ 检查过错误处理
- ✅ 准备好 Cookie Token
- ✅ （可选）配置自定义域名
- ✅ （可选）设置环境变量

---

## 🎉 完成

现在你的 LongCat 2API 已成功部署到 Vercel！

**下一步**：
1. 在 OpenAI 客户端中配置 API
2. 测试各个模型功能
3. （可选）绑定自定义域名
4. （可选）设置监控和告警

享受你的 Serverless API 服务！🚀
