# 📚 API 文档目录

欢迎使用 SVG 转换服务 API 文档！本目录包含了完整的 API 使用指南。

## 📖 文档导航

### 🚀 新手入门

**选择您的角色：**

#### 👨‍💻 我是开发人员，想快速上手
👉 **开始**: [API 快速参考卡](./API-QUICK-REFERENCE.md)

- ⏱️ 需要时间: 5-10 分钟
- 📝 内容: 常用命令、快速示例、速查表
- 🎯 目标: 能够发送第一个 API 请求

---

#### 📋 我想了解所有可用的 API 端点
👉 **开始**: [API 端点总结](./API-ENDPOINT-SUMMARY.md)

- ⏱️ 需要时间: 15-20 分钟
- 📝 内容: 端点列表、请求/响应格式、工作流
- 🎯 目标: 理解 API 的整体结构

---

#### 📖 我需要完整的 API 文档
👉 **开始**: [完整 API 文档](./API-CN.md)

- ⏱️ 需要时间: 30-45 分钟
- 📝 内容: 详细的端点说明、参数解释、代码示例
- 🎯 目标: 掌握所有 API 功能细节

---

#### 🧪 我想用 Postman 进行 API 测试
👉 **开始**: [导入 Postman Collection](./SVGConvert-API.postman_collection.json)

- ⏱️ 需要时间: 5 分钟
- 🎯 目标: 使用 Postman GUI 测试 API

**导入步骤：**
1. 打开 Postman
2. 点击 `Import` 按钮
3. 选择 `SVGConvert-API.postman_collection.json` 文件
4. 设置 `baseUrl` 变量为 `http://localhost:3000`
5. 开始测试

---

## 📂 文档说明

| 文件 | 类型 | 适合场景 | 大小 |
|------|------|--------|------|
| **API-QUICK-REFERENCE.md** | 速查表 | 已有基础，需要快速查阅 | ⭐ |
| **API-ENDPOINT-SUMMARY.md** | 总结表 | 了解 API 全貌 | ⭐⭐ |
| **API-CN.md** | 完整文档 | 深入学习和参考 | ⭐⭐⭐ |
| **SVGConvert-API.postman_collection.json** | 工具配置 | 使用 Postman 测试 | ⭐⭐ |

---

## 🎯 学习路径

### 初级开发者

```
1. API-QUICK-REFERENCE.md
   学习基础概念和常用命令
   
2. 尝试 curl 命令
   发送第一个请求
   
3. SVGConvert-API.postman_collection.json
   使用图形工具测试
   
✅ 可以: 上传文件、查询状态、下载结果
```

### 中级开发者

```
1. API-ENDPOINT-SUMMARY.md
   理解 API 结构
   
2. API-CN.md 的 "完整示例" 部分
   学习完整流程
   
3. 集成到自己的应用
   
✅ 可以: 集成到 Web/移动应用
```

### 高级开发者

```
1. API-CN.md (完整阅读)
   理解所有细节和配置
   
2. 实现错误处理和重试机制
   
3. 性能优化和并发处理
   
4. 生产环境部署
   
✅ 可以: 构建生产级应用
```

---

## 🔄 典型工作流

```
┌──────────────┐
│ 1. 上传文件  │  POST /api/upload
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│ 2. 获取 Task ID      │  返回 taskId
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ 3. 轮询查询状态      │  GET /api/status/:taskId
└──────┬───────────────┘
       │
       ├─ PENDING/PROCESSING
       │  └─ 继续轮询
       │
       └─ COMPLETED
          
          ↓
┌──────────────────────┐
│ 4. 下载文件          │  GET /api/download/:taskId
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ 5. 清理任务(可选)    │  DELETE /api/cleanup/:taskId
└──────────────────────┘
```

---

## 🔗 相关文档

### 项目文档
- [快速开始](./QUICKSTART.md) - 服务器快速开始指南
- [后端开发指南](./docs/BACKEND_DEVELOPMENT_GUIDE.md) - 开发指南
- [部署指南](./docs/DEPLOYMENT.md) - 部署说明
- [README](./README.md) - 项目介绍

### 转换支持
- [支持的转换格式](./API-CN.md#高级特性) - 完整的转换矩阵

---

## 💬 常见问题

### 📝 文档问题

**Q: 我应该先读哪个文档？**
```
如果你：
• 只有 5 分钟 → API-QUICK-REFERENCE.md
• 有 15 分钟 → API-ENDPOINT-SUMMARY.md  
• 有 30+ 分钟 → API-CN.md（完整文档）
```

**Q: 三个文档的区别是什么？**
```
• 快速参考    = 常用命令速查表
• 端点总结    = API 结构和总体说明
• 完整文档    = 详细的参数和示例
```

**Q: 如何找到特定参数的说明？**
```
1. 用 Ctrl+F (或 Cmd+F) 搜索参数名
2. 查看对应的参数表
3. 找到详细说明和示例
```

### 🔧 技术问题

**Q: 我的请求返回 400 错误，怎么办？**
```
1. 检查参数是否正确（API-CN.md 的参数表）
2. 确保使用了正确的 HTTP 方法（GET/POST/DELETE）
3. 验证 Content-Type 是否正确
4. 查看错误代码说明（API-CN.md 的错误代码部分）
```

**Q: 上传总是失败，如何调试？**
```
1. 检查文件格式是否支持（转换矩阵）
2. 确认文件大小 < 20MB
3. 尝试使用简单的 SVG 文件测试
4. 查看服务器日志：docker-compose logs
```

**Q: 如何测试 API？**
```
• 命令行: 使用 API-QUICK-REFERENCE.md 中的 curl 命令
• GUI: 导入 SVGConvert-API.postman_collection.json 到 Postman
• 代码: 使用 API-CN.md 中的 JavaScript 示例
```

---

## 🚀 快速开始模板

### 使用 cURL 的最小示例

```bash
# 1. 上传
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.svg" \
  -F "outputFormat=png" > task.json

# 2. 提取 taskId
TASK_ID=$(jq -r '.taskId' task.json)

# 3. 查询状态直到完成
while true; do
  STATUS=$(curl -s http://localhost:3000/api/status/$TASK_ID | jq -r '.status')
  [ "$STATUS" = "COMPLETED" ] && break
  sleep 1
done

# 4. 下载
curl -O http://localhost:3000/api/download/$TASK_ID
```

### 使用 JavaScript 的最小示例

```javascript
const taskId = (await (await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: new FormData(document.querySelector('form'))
})).json()).taskId;

const blob = await (await fetch(
  `http://localhost:3000/api/download/${taskId}`
)).blob();

// 下载文件
URL.revokeObjectURL(URL.createObjectURL(blob));
```

---

## 📞 获取帮助

### 文档相关
- 📖 查看对应的文档部分
- 🔍 使用浏览器的搜索功能 (Ctrl+F)
- 📝 检查示例代码

### 技术问题
- 🐛 查看错误代码说明
- 📋 使用 Postman 测试
- 📊 检查服务器日志

### 仍需帮助？
- 📧 联系开发团队
- 💬 提交问题
- 🤝 查看相关项目文档

---

## 📊 快速参考

### HTTP 方法
```
POST   /api/upload          上传文件
GET    /api/status/:taskId  查询状态
GET    /api/download/:id    下载文件
DELETE /api/cleanup/:id     清理任务
```

### 状态值
```
PENDING    → PROCESSING → COMPLETED
                      ↓
                     ERROR
```

### 错误代码
```
400: file_too_large, invalid_format, ...
404: task_not_found, file_not_found, ...
500: upload_failed, internal_error, ...
```

---

## ✅ 下一步行动

### 🎯 推荐路径

1. **现在就开始**
   ```
   → 阅读: API-QUICK-REFERENCE.md (5 分钟)
   → 尝试: cURL 快速示例
   → 运行: Postman 测试
   ```

2. **深入学习**
   ```
   → 阅读: API-ENDPOINT-SUMMARY.md (15 分钟)
   → 阅读: API-CN.md 的完整示例
   → 集成: 到您的应用
   ```

3. **生产部署**
   ```
   → 阅读: DEPLOYMENT.md
   → 配置: 环境变量
   → 测试: 完整流程
   ```

---

## 📝 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|--------|
| 1.0.0 | 2025-01-15 | 初始版本，包含 4 份文档 |

---

## 📄 许可证

所有文档均采用 MIT 许可证。

---

**🎉 开始使用吧！选择上面的任何一份文档开始学习。**

---

*提示: 在 VS Code 中，您可以使用 Markdown Preview 预览这些文档。*  
*提示: 在 Postman 中，点击右上角的 `Docs` 可以查看导入的 Collection 文档。*

