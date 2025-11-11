# 快速启动指南

## 🚀 5分钟快速开始

### 前置条件

- Node.js 18+
- pnpm
- （可选）Docker

---

## 模式选择

### 选项 A：本地模式（开发/演示）

**配置时间**：2 分钟  
**适用场景**：本地开发、演示、小规模部署

#### 1. 安装依赖
```bash
cd svgconvert-server
pnpm install
```

#### 2. 启动服务
```bash
pnpm run dev
```

#### 3. 测试
```bash
# 创建测试文件
echo '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>' > test.svg

# 上传并转换
curl -X POST \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  http://localhost:3000/api/upload

# 获取 taskId，然后查询状态和下载
```

---

### 选项 B：混合模式（生产推荐）

**配置时间**：10 分钟  
**适用场景**：生产环境、需要用户选择的场景

#### 1. 获取 Cloudflare 凭证

从 Cloudflare 控制面板获取：
- R2 Account ID
- R2 API Token（访问密钥和秘密密钥）

#### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# R2 配置（从 Cloudflare 获取）
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key

# 启用队列模式
ENABLE_QUEUE_MODE=true
QUEUE_WEBHOOK_SECRET=your-random-secret-key

# 启用回调
ENABLE_CALLBACK=true
```

#### 3. 安装依赖
```bash
pnpm install
```

#### 4. 构建
```bash
npm run build
```

#### 5. 启动（开发）
```bash
pnpm run dev
```

#### 6. 启动（生产）
```bash
npm start
```

或使用 Docker：
```bash
docker-compose up -d
```

---

## 📝 环境变量速查表

| 变量 | 必需 | 示例值 | 说明 |
|------|------|--------|------|
| `NODE_ENV` | 否 | `production` | 环境 |
| `PORT` | 否 | `3000` | 服务端口 |
| `R2_ACCOUNT_ID` | 按需 | `abc123def` | R2 账户 ID |
| `R2_ACCESS_KEY_ID` | 按需 | `xxx` | R2 访问密钥 |
| `R2_SECRET_ACCESS_KEY` | 按需 | `xxx` | R2 秘密密钥 |
| `ENABLE_QUEUE_MODE` | 否 | `true` | 启用队列 |
| `QUEUE_WEBHOOK_SECRET` | 按需 | `secret123` | 队列密钥 |
| `ENABLE_CALLBACK` | 否 | `true` | 启用回调 |

---

## 🧪 测试 API

### 健康检查
```bash
curl http://localhost:3000/health
# 响应: { "status": "ok" }
```

### 上传文件（本地模式）
```bash
curl -X POST \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  http://localhost:3000/api/upload
```

### 查询状态
```bash
curl http://localhost:3000/api/status/{taskId}
```

### 下载文件
```bash
curl http://localhost:3000/api/download/{taskId} -o result.png
```

---

## 🐳 Docker 快速部署

### 使用 Docker Compose
```bash
# 编辑 .env 文件后
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 手动 Docker
```bash
# 构建
docker build -t svg-converter .

# 运行
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name svg-converter \
  svg-converter

# 查看日志
docker logs -f svg-converter
```

---

## 📊 日志查看

### 开发模式
日志直接输出到终端，你会看到类似这样的信息：
```
✓ R2 客户端已初始化
✓ 队列模式已启用
Server running at http://localhost:3000
```

### 生产模式
```bash
# 查看最近的日志
tail -f app.log

# 搜索错误
grep ERROR app.log
```

---

## 🔧 常用命令

```bash
# 开发
pnpm run dev

# 构建
npm run build

# 启动生产版本
npm start

# 代码格式化
npm run format

# 代码检查
npm run lint

# 查看日志
docker-compose logs -f
```

---

## ✅ 验证清单

- [ ] 服务启动成功（看到 "running at http://localhost:3000"）
- [ ] 健康检查通过：`curl http://localhost:3000/health`
- [ ] 上传测试通过：成功获取 `taskId`
- [ ] 状态查询通过：能获取任务状态
- [ ] 文件下载通过：能下载转换后的文件
- [ ] R2 连接正常（如启用）：看到 "✓ R2 客户端已初始化"
- [ ] 队列模式正常（如启用）：看到 "✓ 队列模式已启用"

---

## 🆘 遇到问题？

### 问题：Port 3000 已被占用
```bash
# 改用其他端口
PORT=3001 pnpm run dev
```

### 问题：R2 连接失败
```bash
# 检查凭证
echo $R2_ACCOUNT_ID
echo $R2_ACCESS_KEY_ID

# 验证凭证有效性
```

### 问题：队列消息未被处理
```bash
# 确认队列模式已启用
grep "ENABLE_QUEUE_MODE" .env

# 检查日志
docker-compose logs | grep -i queue
```

### 问题：构建失败
```bash
# 清除依赖并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
npm run build
```

---

## 📚 更多文档

- **完整部署指南**：查看 `HYBRID_ARCHITECTURE.md`
- **API 参考**：查看 `docs/API.md`
- **类型定义**：查看 `src/types/cloudflare.ts`

---

## 🎯 下一步

1. 根据需要选择本地模式或混合模式
2. 配置环境变量
3. 启动服务
4. 测试 API
5. 集成到前端
6. 部署到生产环境

---

**祝使用愉快！** 🚀

有问题？检查日志输出或参考完整文档。

