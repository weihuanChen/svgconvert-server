# SVG 转换工具技术设计文档 (TDD)

项目名称： SVG Utility Tool

版本： 1.0

日期： 2025年10月

基于文档： 产品需求文档 (PRD) v1.0

## 1. 架构总览 (Architecture Overview)

本项目采用前后端分离架构，专注于高性能和部署的便捷性。

| **组件**           | **技术栈**                 | **部署环境**               | **主要职责**                                        |
| ------------------ | -------------------------- | -------------------------- | --------------------------------------------------- |
| **前端 (Client)**  | Next.js (React)            | Vercel                     | UI 渲染、国际化路由、用户交互、文件上传与下载管理。 |
| **后端 (Server)**  | Hono (Node.js)             | 自部署服务器 (Self-Hosted) | 文件接收、异步转换处理、转换参数校验、数据清理。    |
| **存储 (Storage)** | 临时磁盘/对象存储 (S3/GCS) | 独立服务/后端服务器        | 暂存用户上传的原始文件和转换后的结果文件。          |

## 2. 后端技术栈与模块设计 (Hono/Node.js)

### 2.1 框架与环境

- **框架：** Hono
- **运行时：** Node.js
- **核心优势：** Hono 轻量、高性能，提供简洁的路由和中间件处理，非常适合作为文件处理服务的网关。

### 2.2 核心处理库 (Conversion Engines)

所有 CPU 密集型的工作都将在后端处理。

| **任务**               | **推荐库/技术**                                              | **职责**                                            |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| **PNG/JPG/PDF 转 SVG** | `Potrace` (通过 Node.js 封装) 或 `ImageTracer.js` 的 Node.js 版本 | 实现位图的矢量化（Trace）。                         |
| **SVG 转 PNG/JPG**     | `Sharp` 或 `Resvg-js`                                        | 高效的 SVG 渲染和位图导出，支持尺寸控制和质量调整。 |
| **SVG/图片 转 PDF**    | `pdf-lib` 或 `jsPDF`                                         | 将转换后的图片嵌入到 PDF 文档中。                   |
| **文件处理**           | Node.js 内建模块 (`fs`, `path`, `crypto`)                    | 处理文件上传、临时存储路径、MIME 类型验证。         |

### 2.3 API 接口设计 (API Endpoints)

所有 API 均应使用 JSON 格式进行通信，并在 Headers 中设置适当的 CORS 规则。

| **方法** | **路径**                | **描述**                                          |
| -------- | ----------------------- | ------------------------------------------------- |
| `POST`   | `/api/upload`           | 接收文件和初始转换参数，启动转换任务。            |
| `GET`    | `/api/status/:taskId`   | 轮询（Polling）查询特定任务的转换状态。           |
| `GET`    | `/api/download/:taskId` | 提供转换完成文件的下载链接。                      |
| `DELETE` | `/api/cleanup/:taskId`  | (可选，用于前端触发) 立即清理已下载或失败的文件。 |

### 2.4 文件安全与清理机制 (Security & Cleanup)

这是后端最关键的部分，直接关系到 PRD 中的数据安全要求。

1. **文件验证：** 上传时严格检查 MIME Type 和文件大小（不超过 20MB）。
2. **任务 ID (Task ID)：** 每个上传文件应分配一个唯一的、安全的 `taskId` (例如使用 UUID)，作为后续状态查询和下载的凭证。
3. **定时清理：** 部署一个定时任务（Cron Job），每隔 5 分钟扫描一次临时文件目录，自动删除所有创建时间超过 **30 分钟** 的文件。

## 3. 前端技术栈与 i18n 实现 (Next.js/Vercel)

### 3.1 框架与部署

- **框架：** Next.js (App Router)
- **部署：** Vercel
- **优势：** 利用 Next.js 的国际化路由、静态生成（SSG）和服务器组件，提供闪电般的加载速度。

### 3.2 国际化 (i18n) 实施方案

我们将使用 Next.js 的路由和配置来实现 i18n，这是最佳实践。

1. **语言配置：** 在 `next.config.js` 中定义支持的语言和默认语言：

   ```
   // next.config.js 示例
   i18n: {
       locales: ['en', 'ja', 'zh'], // 英语, 日语, 中文
       defaultLocale: 'ja',         // 默认使用日语
   },
   ```

2. **路由结构：** 网站 URL 将自动包含语言前缀，例如：

   - **日语首页：** `/[YourDomain].net/ja` (或直接 `/`)
   - **英语首页：** `/[YourDomain].net/en`

3. **资源文件管理：**

   - 所有翻译文本存储在 `app/locales/[lang].json` 或使用 i18n 库（如 `next-intl`）进行管理。

   **`ja.json` 示例 (满足 PRD 要求):**

   ```
   {
     "app_title": "SVG ユーティリティツール",
     "upload_prompt": "ここにファイルをドラッグ＆ドロップ",
     "upload_button": "ファイルをアップロード",
     "start_conversion": "変換を開始",
     "download_button": "ダウンロード",
     "settings_title": "設定",
     "setting_quality": "画質",
     "setting_transparency": "透明度",
     "setting_batch_process": "一括処理"
   }
   ```

### 3.3 用户界面 (UI/UX) 关键点

1. **文件拖放区：** 使用 React 组件实现一个高度可见的拖放区域，实时反馈用户拖放状态。
2. **响应式设计：** 仅使用 **Tailwind CSS** 实现所有样式。利用 `sm:`, `md:`, `lg:` 等前缀确保在手机和桌面上都能良好适应。
3. **异步状态反馈：**
   - 文件上传成功后，UI 必须立即显示“文件列表/配置设置”。
   - 点击“开始转换”后，按钮和状态栏应显示 **“処理中...” (Processing...)**，并定时向后端 `/api/status/:taskId` 发送请求以更新进度条或等待完成。

## 4. 数据流与状态管理 (Data Flow & State)

### 4.1 核心转换流程图

```
graph TD
    A[用户上传文件(PNG/JPG/SVG) + 参数] --> B{Next.js Frontend};
    B --> C[Hono Backend: POST /api/upload];
    C --> D[生成 Task ID & 存储临时文件];
    D --> E[启动异步转换任务(Node.js Worker)];
    E --> F[Hono 返回 {taskId, status: 'PENDING'}];
    F --> G{Frontend: 轮询 GET /api/status/:taskId};
    H{转换完成?};
    E --> H;
    G -- 状态更新 --> H;
    H -- No --> G;
    H -- Yes --> I[前端显示: 'ダウンロード' (下载) 按钮];
    I --> J[Hono Backend: GET /api/download/:taskId];
    J --> K[文件流下载];
    K --> L[定时清理任务: 删除文件];
```

### 4.2 状态管理 (Frontend)

使用 React Context 或 Zustand 来管理应用的关键状态：

- `uploadStatus`: (`IDLE`, `UPLOADING`, `CONVERTING`, `COMPLETED`, `ERROR`)
- `files`: 存储上传文件的数组，每个文件包含其本地信息、目标格式和转换状态 (`taskId` 等)。
- `currentLanguage`: 用于控制 UI 文本的显示。

## 5. 可扩展性与未来规划

- **数据库 (Database)：** 为了支持未来的用户认证、购买 API Key 或存储转换历史，建议集成 **Firestore**。用户 ID (`userId`) 可用于区分私有数据，并在 `/artifacts/{appId}/users/{userId}/history` 路径下存储转换记录。
- **水平扩展：** 当后端负载增大时，Hono 转换服务可以作为无状态容器部署（例如使用 Docker/Kubernetes），通过负载均衡器分发流量。但需要将临时文件存储从本地磁盘迁移到 **云对象存储 (S3/GCS)**。