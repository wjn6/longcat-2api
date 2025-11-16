# LongCat 2API - Vercel 版本

将 LongCat Chat 转换为 OpenAI 兼容 API，部署在 Vercel Serverless 平台

## 🚀 快速部署

### 方法1：Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 进入此目录并部署
cd vercel
vercel --prod
```

### 方法2：GitHub 集成

```bash
# 1. 推送此文件夹到 GitHub
git init
git add .
git commit -m "Initial commit"
git push

# 2. 在 Vercel 导入
访问 https://vercel.com/new
选择你的 GitHub 仓库
根目录选择: vercel
点击 Deploy
```

### 方法3：拖拽部署

1. 访问 https://vercel.com/new
2. 拖拽 `vercel` 文件夹
3. 点击 Deploy

---

## 📁 项目结构

```
vercel/
├── api/
│   └── v1/
│       ├── models.js              # GET /v1/models
│       └── chat/
│           └── completions.js     # POST /v1/chat/completions
├── lib/
│   └── utils.js                   # 工具函数库
├── vercel.json                    # Vercel 配置
├── package.json                   # NPM 配置
└── README.md                      # 本文档
```

---

## 🎨 支持的模型

| 模型名称 | 功能 | 搜索来源 |
|---------|------|---------|
| `LongCat` | 标准对话 | - |
| `LongCat-Thinking` | 深度思考 | - |
| `LongCat-Search` | 联网搜索 | ❌ |
| `LongCat-Search-ShowLinks` | 联网搜索 | ✅ 显示 |
| `LongCat-Search-and-Thinking` | 搜索+思考 | ❌ |
| `LongCat-Search-and-Thinking-ShowLinks` | 搜索+思考 | ✅ 显示 |

---

## 📝 使用方法

部署成功后，你的 API 地址：
```
https://your-project.vercel.app/v1/models
https://your-project.vercel.app/v1/chat/completions
```

### 请求示例

```bash
curl https://your-project.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASSPORT_TOKEN_KEY" \
  -d '{
    "model": "LongCat-Search-ShowLinks",
    "messages": [{"role": "user", "content": "重庆明天天气"}],
    "stream": true
  }'
```

### 在客户端使用

**Cherry Studio / OpenAI Chat 等：**
- **API 地址**: `https://your-project.vercel.app`
- **API 密钥**: 你的 `passport_token_key` Cookie 值
- **模型**: 任选支持的模型

---

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 本地测试
vercel dev
```

访问 `http://localhost:3000` 测试 API

---

## 🌐 自定义域名

1. Vercel Dashboard → 你的项目 → Settings → Domains
2. 添加你的域名（如 `api.yourdomain.com`）
3. 配置 DNS CNAME 记录
4. 等待生效

---

## 🔍 特性

✅ **完全兼容 OpenAI API 格式**  
✅ **支持流式输出（SSE）**  
✅ **自动会话管理和清理**  
✅ **思考内容分离**（`reasoning_content` 字段）  
✅ **搜索来源追加**（ShowLinks 模型）  
✅ **自动 CORS 配置**  
✅ **全球 CDN 加速**  
✅ **自动 HTTPS**  
✅ **Git 集成自动部署**  

---

## 📊 Vercel 免费额度

- **流量**: 100 GB/月
- **函数执行时间**: 10 秒
- **函数大小**: 50 MB
- **部署次数**: 100 次/天
- **并发执行**: 1,000

---

## ❓ 常见问题

### Q: 如何获取 passport_token_key？
A: 访问 https://longcat.chat 登录，F12 → Application → Cookies → 复制 `passport_token_key` 值

### Q: 函数超时怎么办？
A: Vercel 免费版函数超时 10 秒，如遇超时可：
- 升级到 Pro 计划（60 秒）
- 使用非流式响应
- 优化请求

### Q: 如何查看日志？
A: Vercel Dashboard → 你的项目 → Functions → 选择函数 → Logs

### Q: 如何更新部署？
A: 
- CLI: `vercel --prod`
- Git: `git push`（自动触发）

---

## 📞 支持

- 查看部署日志: Vercel Dashboard
- 实时日志: `vercel logs`
- 官方文档: https://vercel.com/docs

---

## 🎉 完成

现在你的 LongCat 2API 已部署到 Vercel！

享受 Serverless、全球 CDN 和自动 HTTPS！
