# 🧪 SVG Convert Server 测试指南

本指南提供了对 https://svgconvert-server.zeabur.app/ 服务的完整测试命令和方法。

---

## 📋 快速测试

### 健康检查
```bash
# 检查服务是否运行
curl https://svgconvert-server.zeabur.app/health
# 期望响应: {"status":"ok"}
```

### 获取服务信息
```bash
curl https://svgconvert-server.zeabur.app/
# 期望响应: {"name":"SVG Convert Server","version":"1.0.0","status":"running"}
```

---

## 🔄 完整转换流程测试

### 步骤 1: 创建测试文件
```bash
cat > test.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="red" stroke="blue" stroke-width="2"/>
  <rect x="10" y="10" width="30" height="30" fill="yellow" opacity="0.7"/>
  <text x="50" y="75" text-anchor="middle" font-size="20" fill="black">SVG Test</text>
</svg>
EOF
```

### 步骤 2: 上传文件
```bash
# SVG 转 PNG
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -H "Accept-Language: zh" | jq .

# 期望响应 (保存 taskId 以备使用):
# {
#   "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "status": "PROCESSING",
#   "message": "文件上传成功"
# }
```

### 步骤 3: 查询任务状态
```bash
# 将 TASK_ID 替换为实际的任务ID
TASK_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

curl https://svgconvert-server.zeabur.app/api/status/$TASK_ID \
  -H "Accept-Language: zh" | jq .

# 期望响应 (当转换完成):
# {
#   "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "status": "COMPLETED"
# }
```

### 步骤 4: 下载转换后的文件
```bash
# 下载文件
curl -O -J https://svgconvert-server.zeabur.app/api/download/$TASK_ID

# 验证文件
file converted_*.png  # 或 converted_*.jpg / converted_*.pdf
```

### 步骤 5: 清理任务
```bash
curl -X DELETE https://svgconvert-server.zeabur.app/api/cleanup/$TASK_ID \
  -H "Accept-Language: zh" | jq .

# 期望响应:
# {
#   "message": "Task cleaned up successfully",
#   "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# }
```

---

## 📝 转换格式测试

### 转换到 PNG
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -F "width=512" \
  -F "height=512" \
  -H "Accept-Language: zh" | jq .
```

### 转换到 JPG (带质量参数)
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=jpg" \
  -F "quality=90" \
  -H "Accept-Language: zh" | jq .
```

### 转换到 PDF
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=pdf" \
  -F "width=1024" \
  -F "height=768" \
  -H "Accept-Language: zh" | jq .
```

### 转换到 SVG (矢量化)
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=svg" \
  -H "Accept-Language: zh" | jq .
```

---

## 🎯 参数测试

### 自定义宽高
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -F "width=800" \
  -F "height=600" \
  -H "Accept-Language: zh" | jq .
```

### 自定义背景色
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -F "backgroundColor=#ffffff" \
  -H "Accept-Language: zh" | jq .
```

### 维持宽高比
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -F "width=512" \
  -F "height=512" \
  -F "maintainAspectRatio=true" \
  -H "Accept-Language: zh" | jq .
```

### JPG 质量设置
```bash
# 低质量 (50)
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=jpg" \
  -F "quality=50" \
  -H "Accept-Language: zh" | jq .

# 高质量 (95)
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=jpg" \
  -F "quality=95" \
  -H "Accept-Language: zh" | jq .
```

---

## ❌ 错误处理测试

### 测试 1: 无文件上传
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "outputFormat=png" \
  -H "Accept-Language: zh" | jq .

# 期望: HTTP 400, error: "no_file"
```

### 测试 2: 无效输出格式
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=invalid" \
  -H "Accept-Language: zh" | jq .

# 期望: HTTP 400, error: "invalid_output_format"
```

### 测试 3: 缺少必要参数
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -H "Accept-Language: zh" | jq .

# 期望: HTTP 400, error 提示缺少 outputFormat
```

### 测试 4: 查询不存在的任务
```bash
curl https://svgconvert-server.zeabur.app/api/status/00000000-0000-0000-0000-000000000000 \
  -H "Accept-Language: zh" | jq .

# 期望: HTTP 404, error: "task_not_found"
```

### 测试 5: 下载不存在的任务
```bash
curl https://svgconvert-server.zeabur.app/api/download/00000000-0000-0000-0000-000000000000 \
  -H "Accept-Language: zh" | jq .

# 期望: HTTP 404, error: "task_not_found"
```

---

## 🌐 国际化测试

### 中文 (zh)
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "outputFormat=png" \
  -H "Accept-Language: zh" | jq '.message'

# 期望: "文件上传失败"
```

### 日文 (ja)
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "outputFormat=png" \
  -H "Accept-Language: ja" | jq '.message'

# 期望: "ファイルのアップロードに失敗しました"
```

### 英文 (en)
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "outputFormat=png" \
  -H "Accept-Language: en" | jq '.message'

# 期望: "File upload failed"
```

---

## 📊 批量测试脚本

### 完整测试脚本
```bash
#!/bin/bash

BASE_URL="https://svgconvert-server.zeabur.app"
TEST_FILE="test.svg"

echo "🧪 开始服务测试..."

# 1. 健康检查
echo "1️⃣ 健康检查..."
curl -s $BASE_URL/health | jq .

# 2. 获取服务信息
echo "2️⃣ 获取服务信息..."
curl -s $BASE_URL/ | jq .

# 3. 上传并转换
echo "3️⃣ 上传文件..."
RESULT=$(curl -s -X POST $BASE_URL/api/upload \
  -F "file=@$TEST_FILE" \
  -F "outputFormat=png" \
  -H "Accept-Language: zh")

TASK_ID=$(echo $RESULT | jq -r '.taskId')
echo "   Task ID: $TASK_ID"

# 4. 等待转换完成
echo "4️⃣ 等待转换完成..."
for i in {1..30}; do
  STATUS=$(curl -s $BASE_URL/api/status/$TASK_ID | jq -r '.status')
  echo "   尝试 $i: $STATUS"
  [ "$STATUS" = "COMPLETED" ] && break
  sleep 1
done

# 5. 下载文件
echo "5️⃣ 下载文件..."
curl -s -O -J $BASE_URL/api/download/$TASK_ID
ls -lh converted_*.png 2>/dev/null && echo "✅ 下载成功"

# 6. 清理
echo "6️⃣ 清理任务..."
curl -s -X DELETE $BASE_URL/api/cleanup/$TASK_ID | jq .

echo "✅ 测试完成！"
```

### 压力测试脚本（多并发）
```bash
#!/bin/bash

BASE_URL="https://svgconvert-server.zeabur.app"
TEST_FILE="test.svg"
CONCURRENT=5

echo "💪 开始压力测试 (并发数: $CONCURRENT)..."

for i in $(seq 1 $CONCURRENT); do
  (
    echo "🚀 任务 $i..."
    RESULT=$(curl -s -X POST $BASE_URL/api/upload \
      -F "file=@$TEST_FILE" \
      -F "outputFormat=png")
    
    TASK_ID=$(echo $RESULT | jq -r '.taskId')
    
    # 等待完成
    while true; do
      STATUS=$(curl -s $BASE_URL/api/status/$TASK_ID | jq -r '.status')
      [ "$STATUS" = "COMPLETED" ] && break
      sleep 0.5
    done
    
    echo "✅ 任务 $i 完成"
    
    # 清理
    curl -s -X DELETE $BASE_URL/api/cleanup/$TASK_ID > /dev/null
  ) &
done

wait
echo "🎉 压力测试完成！"
```

---

## 🔍 调试技巧

### 查看完整的 HTTP 响应
```bash
curl -v https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png"
```

### 只查看响应头
```bash
curl -I https://svgconvert-server.zeabur.app/health
```

### 保存完整响应到文件
```bash
curl -X POST https://svgconvert-server.zeabur.app/api/upload \
  -F "file=@test.svg" \
  -F "outputFormat=png" \
  -o response.json
```

### 格式化 JSON 输出
```bash
# 使用 jq
curl -s https://svgconvert-server.zeabur.app/ | jq .

# 使用 python
curl -s https://svgconvert-server.zeabur.app/ | python -m json.tool
```

### 性能测试
```bash
# 测试响应时间
time curl -s https://svgconvert-server.zeabur.app/health

# 多次请求的平均时间
for i in {1..10}; do time curl -s https://svgconvert-server.zeabur.app/health > /dev/null; done
```

---

## 📱 JavaScript 测试示例

### 完整的前端集成示例
```javascript
async function convertFile() {
  try {
    // 1. 创建 FormData
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('outputFormat', 'png');
    formData.append('width', 512);
    formData.append('height', 512);

    // 2. 上传文件
    const uploadRes = await fetch('https://svgconvert-server.zeabur.app/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept-Language': 'zh'
      }
    });

    if (!uploadRes.ok) throw new Error('上传失败');
    
    const { taskId, status } = await uploadRes.json();
    console.log('任务ID:', taskId, '状态:', status);

    // 3. 轮询查询状态
    let finalStatus = 'PENDING';
    while (finalStatus !== 'COMPLETED' && finalStatus !== 'ERROR') {
      await new Promise(r => setTimeout(r, 1000));
      
      const statusRes = await fetch(
        `https://svgconvert-server.zeabur.app/api/status/${taskId}`,
        { headers: { 'Accept-Language': 'zh' } }
      );
      
      const data = await statusRes.json();
      finalStatus = data.status;
      console.log('当前状态:', finalStatus);
    }

    if (finalStatus === 'ERROR') {
      throw new Error('转换失败');
    }

    // 4. 下载文件
    const downloadRes = await fetch(
      `https://svgconvert-server.zeabur.app/api/download/${taskId}`
    );
    
    const blob = await downloadRes.blob();
    const url = URL.createObjectURL(blob);
    
    // 5. 触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${taskId}.png`;
    a.click();
    
    console.log('✅ 转换完成！');
    
    // 6. 清理
    await fetch(
      `https://svgconvert-server.zeabur.app/api/cleanup/${taskId}`,
      { method: 'DELETE' }
    );

  } catch (err) {
    console.error('❌ 错误:', err.message);
  }
}
```

---

## 📚 相关资源

- 📖 [详细 API 文档](./TEST_REPORT.md)
- 📊 [测试结果总结](./TEST_SUMMARY.txt)
- 🚀 [快速开始指南](./QUICKSTART.md)
- 🔧 [API 快速参考](./API-QUICK-REFERENCE.md)

---

## ✅ 测试检查清单

- [ ] 健康检查端点正常
- [ ] 获取服务信息正常
- [ ] SVG 转 PNG 成功
- [ ] SVG 转 JPG 成功
- [ ] SVG 转 PDF 成功
- [ ] 自定义参数处理正确
- [ ] 错误处理正确
- [ ] 国际化支持正确
- [ ] 文件下载成功
- [ ] 任务清理成功

---

**最后更新**: 2025年11月12日  
**维护者**: SVG Convert Team

