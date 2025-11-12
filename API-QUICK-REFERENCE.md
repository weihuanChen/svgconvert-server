# API 快速参考卡

## 🚀 30 秒快速开始

```bash
# 1. 上传文件
curl -X POST http://localhost:3000/api/upload \
  -F "file=@input.svg" \
  -F "outputFormat=png" \
  > response.json

# 2. 从响应中提取 taskId
TASK_ID=$(jq -r '.taskId' response.json)

# 3. 等待转换完成
while true; do
  STATUS=$(curl -s http://localhost:3000/api/status/$TASK_ID | jq -r '.status')
  [ "$STATUS" = "COMPLETED" ] && break
  echo "状态: $STATUS，等待中..."
  sleep 1
done

# 4. 下载文件
curl -O -J http://localhost:3000/api/download/$TASK_ID

echo "✅ 完成！"
```

---

## 📍 端点速查

### ✅ 常用端点

```
GET  /health                       → 健康检查
POST /api/upload                   → 上传并转换
GET  /api/status/:taskId           → 查询状态
GET  /api/download/:taskId         → 下载文件
DELETE /api/cleanup/:taskId        → 清理任务
```

### 🔄 队列端点（可选）

```
POST /api/queue/process            → 处理队列任务
GET  /api/queue/status/:taskId     → 查询队列状态
```

---

## 📝 上传参数

### 最小参数
```
file           ✅ 必需
outputFormat   ✅ 必需 (svg|png|jpg|pdf)
```

### 可选参数
```
width                 整数      输出宽度
height                整数      输出高度
quality               1-100     JPG质量（默认85）
backgroundColor       字符串    背景色 (#ffffff/transparent)
maintainAspectRatio   布尔      保持宽高比（默认true）
colors                2-256     SVG颜色数
smoothing             0.0-1.0   平滑度
```

---

## 📊 状态码参考

### HTTP 状态码
```
200  ✅ 成功
202  ⏳ 已接受（队列）
400  ❌ 客户端错误
404  ❌ 未找到
500  ❌ 服务器错误
503  ❌ 服务不可用
```

### 任务状态
```
PENDING     ⏳ 等待处理
PROCESSING  🔄 处理中
COMPLETED   ✅ 已完成
ERROR       ❌ 出错
```

---

## 🎯 常见错误

| 错误代码 | 含义 | 解决方案 |
|---------|------|--------|
| `no_file` | 未上传文件 | 检查 file 参数 |
| `file_too_large` | 文件超过 20MB | 压缩文件或分割 |
| `invalid_format` | 格式不支持 | 使用支持的格式 |
| `not_ready` | 转换中 | 稍后重试 |
| `task_not_found` | 任务不存在 | 检查 taskId 是否正确 |
| `file_not_found` | 文件已过期 | 文件在 30 分钟后自动删除 |

---

## 🌐 语言设置

```bash
# 中文
-H "Accept-Language: zh"

# 日文
-H "Accept-Language: ja"

# 英文
-H "Accept-Language: en"
```

---

## 💾 转换支持矩阵

```
输入    ↓ \ 输出 →    SVG    PNG    JPG    PDF
SVG                   —      ✅     ✅     ✅
PNG                   ✅     —      ✅     ✅
JPG                   ✅     ✅     —      ✅
PDF                   ❌     ✅     ✅     —
```

---

## 🔗 完整 curl 示例

### 1️⃣ 转换 SVG to PNG

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.svg" \
  -F "outputFormat=png" \
  -F "width=1024" \
  -F "quality=90" \
  -F "backgroundColor=#ffffff" \
  -H "Accept-Language: zh"
```

### 2️⃣ 转换 PNG to SVG（矢量化）

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.png" \
  -F "outputFormat=svg" \
  -F "colors=16" \
  -F "smoothing=0.5"
```

### 3️⃣ 转换为 PDF

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.png" \
  -F "outputFormat=pdf" \
  -F "width=1024" \
  -F "height=768"
```

### 4️⃣ 查询状态

```bash
curl http://localhost:3000/api/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "Accept-Language: zh"
```

### 5️⃣ 下载文件

```bash
curl -O -J http://localhost:3000/api/download/550e8400-e29b-41d4-a716-446655440000
```

### 6️⃣ 清理任务

```bash
curl -X DELETE http://localhost:3000/api/cleanup/550e8400-e29b-41d4-a716-446655440000
```

---

## 🧪 测试命令集

### 快速测试脚本

```bash
#!/bin/bash

# 配置
API="http://localhost:3000"
LANG="zh"

echo "📤 上传测试..."
RESULT=$(curl -s -X POST $API/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -H "Accept-Language: $LANG")

TASK_ID=$(echo $RESULT | jq -r '.taskId')
echo "Task ID: $TASK_ID"

echo "⏳ 等待转换..."
for i in {1..30}; do
  STATUS=$(curl -s $API/api/status/$TASK_ID | jq -r '.status')
  [ "$STATUS" = "COMPLETED" ] && break
  echo "  尝试 $i: $STATUS"
  sleep 1
done

echo "📥 下载文件..."
curl -O -J $API/api/download/$TASK_ID

echo "🧹 清理任务..."
curl -X DELETE $API/api/cleanup/$TASK_ID

echo "✅ 完成！"
```

---

## 📱 JavaScript 示例

### 完整流程

```javascript
async function convertFile(file, format) {
  try {
    // 上传
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outputFormat', format);
    
    const uploadRes = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Accept-Language': 'zh' }
    });
    
    const { taskId } = await uploadRes.json();
    console.log('Task ID:', taskId);
    
    // 轮询
    let status = 'PENDING';
    while (status !== 'COMPLETED' && status !== 'ERROR') {
      const statusRes = await fetch(
        `http://localhost:3000/api/status/${taskId}`,
        { headers: { 'Accept-Language': 'zh' } }
      );
      const data = await statusRes.json();
      status = data.status;
      console.log('Status:', status);
      
      if (status !== 'COMPLETED') {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    if (status === 'ERROR') throw new Error('转换失败');
    
    // 下载
    const downloadRes = await fetch(
      `http://localhost:3000/api/download/${taskId}`
    );
    const blob = await downloadRes.blob();
    
    // 保存
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${format}`;
    a.click();
    
    console.log('✅ 完成！');
  } catch (err) {
    console.error('❌ 错误:', err);
  }
}
```

---

## ⚙️ 环境变量速查

```bash
# 核心
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=20971520

# R2 存储
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=svgconvert-net

# 队列
ENABLE_QUEUE_MODE=true
QUEUE_WEBHOOK_SECRET=secret

# 回调
ENABLE_CALLBACK=true
CALLBACK_TIMEOUT_MS=30000
```

---

## 🐛 调试技巧

### 查看完整响应
```bash
curl -v http://localhost:3000/api/status/TASK_ID | jq '.'
```

### 监看服务日志
```bash
docker-compose logs -f svgconvert-server
```

### 检查 R2 连接
```bash
curl http://localhost:3000/health
# 应返回 {"status":"ok"}
```

### 测试文件大小限制
```bash
# 创建 25MB 文件
dd if=/dev/zero of=large.bin bs=1M count=25

curl -X POST http://localhost:3000/api/upload \
  -F "file=@large.bin" \
  -F "outputFormat=png"
# 应返回 file_too_large 错误
```

---

## 📚 完整文档链接

- 📖 [完整 API 文档](./API-CN.md)
- 📋 [端点总结](./API-ENDPOINT-SUMMARY.md)
- 🚀 [快速开始](./QUICKSTART.md)
- 🔧 [部署指南](./docs/DEPLOYMENT.md)

---

## 💡 常见问题

**Q: 如何上传大文件？**  
A: 最大 20MB，超大文件建议压缩后上传。

**Q: 转换需要多长时间？**  
A: 通常 1-5 秒，取决于文件大小和复杂度。

**Q: 文件保存多久？**  
A: 30 分钟后自动删除，可手动清理。

**Q: 支持批量转换吗？**  
A: 不支持，需要逐个上传。

**Q: 如何指定输出尺寸？**  
A: 使用 `width` 和 `height` 参数。

**Q: 转换失败怎么办？**  
A: 检查日志，尝试简化文件或调整参数。

---

## 🎓 学习路径

```
1. 阅读本快速参考    (5 分钟)
   ↓
2. 尝试 curl 命令     (10 分钟)
   ↓
3. 集成 JavaScript   (30 分钟)
   ↓
4. 了解高级特性      (可选)
   ↓
5. 生产部署          (需部署知识)
```

---

**最后更新**: 2025-01-15  
**维护者**: SVG Convert Team  
**许可证**: MIT

