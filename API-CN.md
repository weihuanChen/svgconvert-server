# SVG 转换服务 API 文档

## 📋 目录

1. [概述](#概述)
2. [基础信息](#基础信息)
3. [端点详情](#端点详情)
4. [错误处理](#错误处理)
5. [完整示例](#完整示例)
6. [高级特性](#高级特性)

---

## 概述

SVG 转换服务是一个提供文件格式转换的 REST API 服务。支持以下转换方式：

- **SVG ↔ Raster（PNG/JPG）**：使用 Sharp 库进行高质量栅格化
- **Raster → SVG**：使用 Potrace 进行矢量化处理
- **任意格式 → PDF**：将图像嵌入 PDF 文档

### 主要特性

✅ 多种文件格式支持（SVG、PNG、JPG、PDF）  
✅ 灵活的转换参数配置  
✅ 异步处理，支持轮询和回调  
✅ 国际化多语言支持（中文、日文、英文）  
✅ Cloudflare R2 对象存储集成  
✅ Cloudflare Queues 队列任务支持  
✅ 自动清理机制  

---

## 基础信息

### 基础 URL

```
http://localhost:3000
生产环境: https://your-domain.com
```

### Content-Type

所有 JSON 响应的 Content-Type 为 `application/json`  
文件上传使用 `multipart/form-data`  
文件下载返回对应的 MIME 类型

### 认证

当前版本不需要认证，生产环境建议实现 API Key 认证。

### 速率限制

当前未实现速率限制，可根据需要添加：
- 基于 IP 的请求限制
- 并发转换限制
- 文件大小配额

### 超时配置

- 上传超时：30 秒
- 转换超时：根据文件大小（通常 1-5 分钟）
- 下载超时：30 秒

---

## 端点详情

### 1. 健康检查

检查服务器是否运行正常。

**请求**

```
GET /health
```

**响应示例 (200 OK)**

```json
{
  "status": "ok"
}
```

**错误响应 (503 Service Unavailable)**

```json
{
  "status": "error",
  "message": "Service unavailable"
}
```

---

### 2. 服务信息

获取服务版本和基础信息。

**请求**

```
GET /
```

**响应示例**

```json
{
  "name": "SVG Convert Server",
  "version": "1.0.0",
  "status": "running"
}
```

---

### 3. 上传并开始转换

上传文件并启动异步转换流程。

**请求**

```http
POST /api/upload
Content-Type: multipart/form-data
```

**请求参数**

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| file | File | ✅ | - | 输入文件 |
| outputFormat | string | ✅ | - | 输出格式：`svg`、`png`、`jpg`、`pdf` |
| width | integer | ❌ | - | 输出宽度（像素） |
| height | integer | ❌ | - | 输出高度（像素） |
| quality | integer | ❌ | 85 | JPG 质量（1-100） |
| backgroundColor | string | ❌ | transparent | 背景颜色（如 `#ffffff` 或 `transparent`） |
| maintainAspectRatio | boolean | ❌ | true | 保持宽高比 |
| colors | integer | ❌ | - | SVG 矢量化颜色数（2-256） |
| smoothing | float | ❌ | - | 平滑度（0.0-1.0） |

**cURL 示例**

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.svg" \
  -F "outputFormat=png" \
  -F "width=1024" \
  -F "height=768" \
  -F "quality=90" \
  -F "backgroundColor=#ffffff" \
  -H "Accept-Language: zh"
```

**JavaScript 示例**

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('outputFormat', 'png');
formData.append('width', '1024');
formData.append('height', '768');
formData.append('quality', '90');

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Accept-Language': 'zh'
  }
});

const result = await response.json();
const taskId = result.taskId; // 保存用于后续查询
```

**成功响应 (200 OK)**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "message": "文件上传成功"
}
```

**错误响应示例**

```json
{
  "error": "file_too_large",
  "message": "文件大小超过限制（最大：20MB）"
}
```

```json
{
  "error": "invalid_format",
  "message": "不支持的文件格式"
}
```

```json
{
  "error": "invalid_output_format",
  "message": "无效的输出格式"
}
```

---

### 4. 查询转换状态

通过 Task ID 查询任务的当前状态。

**请求**

```http
GET /api/status/:taskId
```

**URL 参数**

| 参数 | 说明 |
|------|------|
| taskId | 上传时返回的任务 ID |

**cURL 示例**

```bash
curl http://localhost:3000/api/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "Accept-Language: zh"
```

**成功响应 (200 OK)**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "error": null
}
```

**状态值说明**

| 状态 | 说明 |
|------|------|
| PENDING | 等待处理 |
| PROCESSING | 正在转换中 |
| COMPLETED | 转换完成 |
| ERROR | 转换失败 |

**失败状态响应**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING",
  "error": null
}
```

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ERROR",
  "error": "转换过程中出错：不支持的颜色空间"
}
```

**错误响应 (404 Not Found)**

```json
{
  "error": "task_not_found",
  "message": "任务未找到"
}
```

**轮询示例**

```javascript
async function waitForCompletion(taskId) {
  let attempts = 0;
  const maxAttempts = 300; // 5分钟（每秒查询一次）
  
  while (attempts < maxAttempts) {
    const response = await fetch(`http://localhost:3000/api/status/${taskId}`);
    const data = await response.json();

    if (data.status === 'COMPLETED') {
      return { success: true, taskId };
    } else if (data.status === 'ERROR') {
      return { success: false, error: data.error };
    }

    // 等待 1 秒后重试
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error('任务处理超时');
}
```

---

### 5. 下载转换结果

下载已转换完成的文件。

**请求**

```http
GET /api/download/:taskId
```

**URL 参数**

| 参数 | 说明 |
|------|------|
| taskId | 上传时返回的任务 ID |

**cURL 示例**

```bash
# 下载文件并保存
curl -O -J http://localhost:3000/api/download/550e8400-e29b-41d4-a716-446655440000
```

**成功响应 (200 OK)**

- 返回二进制文件内容
- Headers:
  - `Content-Type`: 对应的 MIME 类型（如 `image/png`）
  - `Content-Disposition`: `attachment; filename="converted_[taskId].[ext]"`
  - `Content-Length`: 文件大小（字节）

**JavaScript 示例**

```javascript
async function downloadFile(taskId) {
  const response = await fetch(`http://localhost:3000/api/download/${taskId}`);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('下载失败:', error);
    return;
  }
  
  const blob = await response.blob();
  
  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `converted.${getExtension(response.headers.get('content-type'))}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
```

**错误响应示例**

```json
{
  "error": "not_ready",
  "message": "转换进行中...",
  "status": "PROCESSING"
}
```

```json
{
  "error": "conversion_failed",
  "message": "转换失败",
  "details": "输出格式不受支持"
}
```

```json
{
  "error": "file_not_found",
  "message": "文件未找到或已过期"
}
```

---

### 6. 手动清理任务

手动删除任务数据和临时文件（可选，文件会自动在 30 分钟后清理）。

**请求**

```http
DELETE /api/cleanup/:taskId
```

**URL 参数**

| 参数 | 说明 |
|------|------|
| taskId | 上传时返回的任务 ID |

**cURL 示例**

```bash
curl -X DELETE http://localhost:3000/api/cleanup/550e8400-e29b-41d4-a716-446655440000
```

**成功响应 (200 OK)**

```json
{
  "message": "任务已清理",
  "taskId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**错误响应 (404 Not Found)**

```json
{
  "error": "task_not_found",
  "message": "任务未找到"
}
```

---

### 7. 队列任务处理（可选）

在启用 Cloudflare Queues 时处理队列消息。

**请求**

```http
POST /api/queue/process
Content-Type: application/json
```

**请求体**

```json
{
  "taskId": "task-123",
  "sourceFileKey": "input/2025-01-15/task-123/document.svg",
  "fileName": "document.svg",
  "sourceFormat": "svg",
  "options": {
    "targetFormat": "png",
    "width": 1024,
    "height": 768,
    "quality": 90,
    "backgroundColor": "#ffffff",
    "maintainAspectRatio": true
  },
  "callbackUrl": "https://api.example.com/callback",
  "callbackToken": "secret-token-123"
}
```

**成功响应 (202 Accepted)**

```json
{
  "success": true,
  "taskId": "task-123",
  "message": "任务已接受处理"
}
```

---

### 8. 查询队列任务状态

查询通过队列处理的任务状态。

**请求**

```http
GET /api/queue/status/:taskId
```

**URL 参数**

| 参数 | 说明 |
|------|------|
| taskId | 队列任务 ID |

**成功响应**

```json
{
  "taskId": "task-123",
  "status": "COMPLETED",
  "error": null,
  "completedAt": "2025-01-15T10:30:45.123Z"
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "error": "error_code",
  "message": "用户友好的错误信息",
  "details": "详细的错误信息（可选）"
}
```

### HTTP 状态码

| 状态码 | 说明 | 场景 |
|-------|------|------|
| 200 | 成功 | 请求成功处理 |
| 202 | 已接受 | 队列任务已接受 |
| 400 | 客户端错误 | 无效的参数、文件太大等 |
| 404 | 未找到 | 任务不存在、文件已过期 |
| 500 | 服务器错误 | 内部处理错误 |
| 503 | 服务不可用 | 服务器故障 |

### 常见错误代码

| 错误代码 | HTTP 状态码 | 说明 |
|---------|-----------|------|
| no_file | 400 | 未上传文件 |
| file_too_large | 400 | 文件超过大小限制 |
| invalid_format | 400 | 不支持的输入格式 |
| invalid_output_format | 400 | 不支持的输出格式 |
| invalid_params | 400 | 无效的转换参数 |
| not_ready | 400 | 转换尚未完成 |
| conversion_failed | 400 | 转换过程中出错 |
| task_not_found | 404 | 任务不存在 |
| file_not_found | 404 | 文件不存在或已过期 |
| upload_failed | 500 | 上传失败 |
| download_failed | 500 | 下载失败 |
| internal_error | 500 | 内部错误 |

---

## 完整示例

### 完整的转换流程（JavaScript）

```javascript
/**
 * 完整的文件转换流程示例
 */
async function convertFile() {
  try {
    // 1. 上传文件
    console.log('📤 上传文件...');
    const formData = new FormData();
    formData.append('file', document.querySelector('input[type=file]').files[0]);
    formData.append('outputFormat', 'png');
    formData.append('width', '1024');
    formData.append('quality', '90');

    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Accept-Language': 'zh' }
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`上传失败: ${error.message}`);
    }

    const { taskId } = await uploadResponse.json();
    console.log('✅ 文件已上传，Task ID:', taskId);

    // 2. 轮询检查状态
    console.log('⏳ 等待转换完成...');
    let status = 'PENDING';
    let attempts = 0;

    while (status !== 'COMPLETED' && status !== 'ERROR' && attempts < 300) {
      const statusResponse = await fetch(
        `http://localhost:3000/api/status/${taskId}`,
        { headers: { 'Accept-Language': 'zh' } }
      );

      const data = await statusResponse.json();
      status = data.status;

      if (status === 'COMPLETED') {
        console.log('✅ 转换完成');
        break;
      } else if (status === 'ERROR') {
        throw new Error(`转换失败: ${data.error}`);
      }

      console.log(`⏳ 状态: ${status}, 等待中...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= 300) {
      throw new Error('转换超时');
    }

    // 3. 下载文件
    console.log('📥 下载转换结果...');
    const downloadResponse = await fetch(
      `http://localhost:3000/api/download/${taskId}`,
      { headers: { 'Accept-Language': 'zh' } }
    );

    if (!downloadResponse.ok) {
      const error = await downloadResponse.json();
      throw new Error(`下载失败: ${error.message}`);
    }

    const blob = await downloadResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted_${taskId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ 文件下载完成');

    // 4. 清理任务（可选）
    console.log('🧹 清理任务...');
    await fetch(`http://localhost:3000/api/cleanup/${taskId}`, {
      method: 'DELETE',
      headers: { 'Accept-Language': 'zh' }
    });

    console.log('✅ 任务已清理');
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}
```

### cURL 完整流程示例

```bash
#!/bin/bash

# 1. 上传文件
echo "📤 上传文件..."
TASK_ID=$(curl -s -X POST http://localhost:3000/api/upload \
  -F "file=@image.svg" \
  -F "outputFormat=png" \
  -F "width=1024" \
  -H "Accept-Language: zh" | jq -r '.taskId')

echo "✅ Task ID: $TASK_ID"

# 2. 轮询状态
echo "⏳ 等待转换完成..."
while true; do
  STATUS=$(curl -s http://localhost:3000/api/status/$TASK_ID \
    -H "Accept-Language: zh" | jq -r '.status')
  
  echo "📊 状态: $STATUS"
  
  if [ "$STATUS" = "COMPLETED" ]; then
    echo "✅ 转换完成"
    break
  elif [ "$STATUS" = "ERROR" ]; then
    echo "❌ 转换失败"
    exit 1
  fi
  
  sleep 1
done

# 3. 下载文件
echo "📥 下载文件..."
curl -O -J http://localhost:3000/api/download/$TASK_ID

echo "✅ 文件已下载"

# 4. 清理任务（可选）
echo "🧹 清理任务..."
curl -X DELETE http://localhost:3000/api/cleanup/$TASK_ID

echo "✅ 完成"
```

---

## 高级特性

### 国际化支持

通过 `Accept-Language` 请求头指定语言：

```bash
# 中文
curl http://localhost:3000/api/status/TASK_ID \
  -H "Accept-Language: zh"

# 日文
curl http://localhost:3000/api/status/TASK_ID \
  -H "Accept-Language: ja"

# 英文
curl http://localhost:3000/api/status/TASK_ID \
  -H "Accept-Language: en"
```

支持的语言：
- `zh` - 中文（简体）
- `ja` - 日文
- `en` - 英文

### Cloudflare R2 集成

启用环境变量后，转换结果会自动上传到 R2：

```bash
export R2_ACCOUNT_ID=xxxx
export R2_ACCESS_KEY_ID=xxxx
export R2_SECRET_ACCESS_KEY=xxxx
export R2_BUCKET_NAME=svgconvert-net
```

### Cloudflare Queues 支持

启用队列模式进行异步处理：

```bash
export ENABLE_QUEUE_MODE=true
export QUEUE_WEBHOOK_SECRET=your-secret
```

### 转换矩阵

支持的转换路径：

| 输入格式 | 输出格式 | 支持状态 | 说明 |
|---------|---------|--------|------|
| SVG | PNG | ✅ | 高质量栅格化 |
| SVG | JPG | ✅ | 包含背景色 |
| SVG | PDF | ✅ | 矢量 PDF |
| PNG | SVG | ✅ | 矢量化处理 |
| JPG | SVG | ✅ | 矢量化处理 |
| PNG | JPG | ✅ | 直接转换 |
| JPG | PNG | ✅ | 直接转换 |
| PNG | PDF | ✅ | 图像嵌入 |
| JPG | PDF | ✅ | 图像嵌入 |

---

## 版本信息

**当前版本**: 1.0.0  
**最后更新**: 2025-01-15  
**API 稳定性**: 稳定 ✅

---

## 支持和反馈

如有问题或建议，请提交 Issue 或联系开发团队。

- 📧 Email: support@example.com
- 🐛 Issues: GitHub Issues
- 💬 讨论: GitHub Discussions

