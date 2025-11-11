# 混合架构部署指南

## 📋 概览

该文档介绍如何配置和部署混合架构模式的 SVG 转换服务。混合架构支持两种工作模式的同时运行：
- **本地模式**：用户直接上传文件
- **队列模式**：通过 Cloudflare Queues 异步处理

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────┐
│      前端 (Cloudflare Pages)        │
│   - 已配置 R2 和 Queues             │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    ↓                     ↓
┌─────────┐         ┌──────────────┐
│ 直接    │         │ Cloudflare   │
│ 上传    │         │ R2 + Queues  │
│ (HTTP)  │         │              │
└────┬────┘         └────┬─────────┘
     │                   │
     └───────────┬───────┘
                 ↓
        ┌────────────────────┐
        │    VPS 服务        │
        │  (混合模式支持)    │
        └────────────────────┘
             ↑          ↓
         上传到    回调通知
         本地/R2   前端
```

---

## 🔧 环境变量配置

### 基础配置（总是需要）

```bash
NODE_ENV=production
PORT=3000
TEMP_DIR=/app/temp
MAX_FILE_SIZE=20971520
CLEANUP_INTERVAL_MINUTES=5
FILE_RETENTION_MINUTES=30
ALLOWED_ORIGINS=*
```

### R2 配置（可选，启用时必需）

```bash
# 必需：R2 账户 ID
R2_ACCOUNT_ID=your-account-id

# 必需：R2 凭证
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key

# 可选：R2 存储桶名称
R2_BUCKET_NAME=svg-converter
```

### 队列配置（可选，启用时必需）

```bash
# 启用队列模式
ENABLE_QUEUE_MODE=true

# 队列 Webhook 密钥（用于验证来自 Cloudflare 的请求）
QUEUE_WEBHOOK_SECRET=your-secure-random-secret

# 启用回调通知
ENABLE_CALLBACK=true

# 回调超时时间（毫秒）
CALLBACK_TIMEOUT_MS=30000
```

---

## 📝 部署步骤

### 第 1 步：安装依赖

```bash
cd svgconvert-server
pnpm install
```

### 第 2 步：配置环境变量

编辑 `.env` 文件（复制自 `.env.example`）：

**模式 A - 本地模式（开发/小规模部署）**
```bash
# 只配置基础设置
NODE_ENV=development
PORT=3000
# ... 其他基础配置
```

**模式 B - 完整混合模式（生产推荐）**
```bash
# 配置所有内容
NODE_ENV=production
PORT=3000

# R2 配置（从 Cloudflare 获取）
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx

# 队列配置
ENABLE_QUEUE_MODE=true
QUEUE_WEBHOOK_SECRET=your-secure-secret
ENABLE_CALLBACK=true
```

### 第 3 步：本地测试

```bash
# 开发模式
pnpm run dev

# 访问健康检查
curl http://localhost:3000/health
# 响应: { "status": "ok" }

# 访问根路径
curl http://localhost:3000/
# 响应: { "name": "SVG Convert Server", "version": "1.0.0", "status": "running" }
```

### 第 4 步：Docker 部署

**构建镜像**
```bash
docker build -t svg-converter-vps .
```

**运行容器**
```bash
docker run -d \
  --name svg-converter \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  svg-converter-vps
```

**使用 Docker Compose**
```bash
docker-compose up -d
```

---

## 📡 API 端点

### 公共端点（两种模式都支持）

#### 1. 健康检查
```bash
GET /health
```

响应：
```json
{ "status": "ok" }
```

#### 2. 直接上传文件（本地模式）
```bash
POST /api/upload
Content-Type: multipart/form-data

file: <binary-file>
outputFormat: png
width: 800
height: 600
```

响应：
```json
{
  "taskId": "uuid-v4",
  "status": "PENDING",
  "message": "Upload successful"
}
```

#### 3. 查询转换状态
```bash
GET /api/status/:taskId
```

响应：
```json
{
  "taskId": "uuid-v4",
  "status": "COMPLETED|PROCESSING|PENDING|ERROR",
  "error": null
}
```

#### 4. 下载文件（本地模式）
```bash
GET /api/download/:taskId
```

响应：二进制文件内容

### 队列专用端点（仅当 ENABLE_QUEUE_MODE=true 时）

#### 1. 处理队列消息
```bash
POST /api/queue/process
Content-Type: application/json
Authorization: Bearer <QUEUE_WEBHOOK_SECRET>

{
  "taskId": "uuid-v4",
  "bucketName": "svg-converter",
  "sourceFileKey": "input/2025-01-11/task-id/example.svg",
  "fileName": "example.svg",
  "sourceFormat": "svg",
  "options": {
    "targetFormat": "png",
    "width": 800,
    "height": 600
  },
  "callbackUrl": "https://your-frontend/api/callback",
  "callbackToken": "token"
}
```

响应（202 已接受）：
```json
{
  "success": true,
  "taskId": "uuid-v4",
  "message": "Task accepted for processing"
}
```

#### 2. 查询队列任务状态
```bash
GET /api/queue/status/:taskId
```

响应：
```json
{
  "taskId": "uuid-v4",
  "status": "PROCESSING|COMPLETED|ERROR",
  "error": null,
  "completedAt": "2025-01-11T12:00:00Z"
}
```

---

## 🔄 工作流程对比

### 模式 1：本地上传模式

```sequence
前端 ->> VPS: 1. POST /api/upload (multipart/form-data)
VPS ->> 本地: 2. 保存上传的文件
VPS ->> VPS: 3. 异步转换
Note over VPS: 处理中...
前端 ->> VPS: 4. GET /api/status/:taskId (轮询)
VPS -->> 前端: 5. 状态响应
前端 ->> VPS: 6. GET /api/download/:taskId
VPS -->> 前端: 7. 返回转换后的文件
```

### 模式 2：队列处理模式

```sequence
前端 ->> R2: 1. PUT 上传源文件
R2 -->> 前端: 2. 文件已保存
前端 ->> Queues: 3. 发送消息
Queues ->> VPS: 4. 推送消息到 /api/queue/process
VPS ->> R2: 5. GET 下载源文件
R2 -->> VPS: 6. 返回文件
VPS ->> VPS: 7. 转换文件
VPS ->> R2: 8. PUT 上传结果
R2 -->> VPS: 9. 确认上传
VPS ->> 前端: 10. POST /api/callback (回调)
前端 -->> VPS: 11. 确认
```

---

## 🧪 测试指南

### 测试本地上传模式

```bash
# 1. 准备测试文件
echo '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>' > test.svg

# 2. 上传文件
curl -X POST \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -F "width=200" \
  http://localhost:3000/api/upload

# 响应会包含 taskId

# 3. 查询状态
curl http://localhost:3000/api/status/{taskId}

# 4. 等待完成后下载
curl http://localhost:3000/api/download/{taskId} -o result.png
```

### 测试队列模式

```bash
# 创建测试脚本：test-queue.sh

#!/bin/bash

TASK_ID=$(uuidgen)
CALLBACK_SECRET="test-secret"

# 1. 先上传文件到 R2（需要前端完成）
# 2. 发送消息到 VPS

curl -X POST http://localhost:3000/api/queue/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret" \
  -d '{
    "taskId": "'$TASK_ID'",
    "bucketName": "svg-converter",
    "sourceFileKey": "input/2025-01-11/'$TASK_ID'/test.svg",
    "fileName": "test.svg",
    "sourceFormat": "svg",
    "options": {
      "targetFormat": "png",
      "width": 800
    },
    "callbackUrl": "http://localhost:3000/test-callback",
    "callbackToken": "'$CALLBACK_SECRET'"
  }'

# 3. 查询队列任务状态
sleep 2
curl http://localhost:3000/api/queue/status/$TASK_ID
```

---

## 📊 监控和日志

### 日志输出示例

**启用 R2 时：**
```
✓ R2 客户端已初始化
✓ 队列模式已启用
📋 [队列] 接收到任务: task-123
📥 [队列] 从 R2 下载源文件: input/2025-01-11/task-123/example.svg
✓ [队列] 源文件已下载: ... (1024 bytes)
🔄 [队列] 开始转换: SVG → PNG
✓ [队列] 转换完成: /app/temp/task-123/output.png
📤 [队列] 上传输出文件到 R2: output/2025-01-11/task-123/example.png
✓ [队列] 输出文件已上传: ... (2048 bytes)
🔔 [队列] 发送完成回调: task-123
✓ 回调发送成功: task-123
✓ [队列] 任务完成: task-123 (耗时: 1234ms)
```

**禁用 R2 时：**
```
⚠ R2 客户端未启用 (缺少 R2_ACCOUNT_ID)
⚠ 队列模式已禁用，使用本地文件上传模式
```

---

## 🚀 性能优化建议

### 1. R2 优化
- 使用正确的 Region（通常 `auto`）
- 监控 R2 存储成本
- 定期清理过期文件

### 2. VPS 优化
- 使用 SSD 作为临时目录
- 适当调整 `CLEANUP_INTERVAL_MINUTES`
- 监控磁盘空间使用

### 3. 网络优化
- 启用 gzip 压缩（在反向代理层）
- 使用 CDN 加速（特别是下载）
- 优化队列消息大小

---

## 🔐 安全注意事项

1. **环境变量**
   - 不要提交 `.env` 文件到 Git
   - 定期轮换 R2 凭证
   - 使用强密码作为 `QUEUE_WEBHOOK_SECRET`

2. **API 认证**
   - 队列端点需要 Bearer token 认证
   - 验证 `callbackToken` 的真实性

3. **文件大小**
   - 配置合理的 `MAX_FILE_SIZE`
   - 监控磁盘空间

4. **CORS**
   - 在生产环境中设置具体的 `ALLOWED_ORIGINS`
   - 不要使用 `*` 通配符

---

## 🐛 常见问题

### Q1: R2 连接失败？
**检查清单：**
- ✓ R2_ACCOUNT_ID 正确
- ✓ 访问密钥有效
- ✓ 存储桶存在
- ✓ VPS 能访问 Cloudflare

### Q2: 队列消息未被处理？
**检查清单：**
- ✓ ENABLE_QUEUE_MODE=true
- ✓ QUEUE_WEBHOOK_SECRET 与前端一致
- ✓ 前端 Queues 配置正确
- ✓ 查看 VPS 日志

### Q3: 回调失败？
**检查清单：**
- ✓ ENABLE_CALLBACK=true
- ✓ callbackUrl 可从 VPS 访问
- ✓ callbackToken 正确
- ✓ 前端回调端点在线

---

## 📦 部署到生产环境

### 使用 Docker Compose（推荐）

编辑 `docker-compose.yml` 的环境变量部分：

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
  - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
  - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
  - ENABLE_QUEUE_MODE=true
  - QUEUE_WEBHOOK_SECRET=${QUEUE_WEBHOOK_SECRET}
  - ENABLE_CALLBACK=true
```

启动：
```bash
docker-compose up -d
```

### 使用反向代理（Nginx）

```nginx
upstream svg_converter {
  server localhost:3000;
}

server {
  listen 80;
  server_name your-vps-domain.com;

  # 增加上传大小限制
  client_max_body_size 20M;

  location / {
    proxy_pass http://svg_converter;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支持（如需要）
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

## 📚 相关文件

- **类型定义**：`src/types/cloudflare.ts`（与前端保持一致）
- **R2 客户端**：`src/services/r2-client.ts`
- **回调工具**：`src/utils/callback.ts`
- **队列路由**：`src/routes/queue.ts`
- **配置**：`src/config/index.ts`

---

## ✅ 部署检查清单

- [ ] 依赖已安装
- [ ] `.env` 文件已配置
- [ ] 本地测试通过
- [ ] R2 凭证验证成功
- [ ] Docker 镜像已构建
- [ ] 容器正常运行
- [ ] 健康检查通过
- [ ] 日志输出正常
- [ ] 前端能正常调用
- [ ] 回调功能测试通过

---

## 🎯 下一步

1. **配置前端**：在前端中配置 VPS 端点 URL
2. **测试集成**：执行端到端测试
3. **监控告警**：设置日志监控和告警
4. **性能调优**：根据实际使用调整参数
5. **文档维护**：保持配置文档更新

---

**部署成功！** 🎉

你现在拥有一个支持本地模式和队列模式的混合架构 SVG 转换服务。

