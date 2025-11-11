# API Documentation

## Overview

This document provides detailed information about the SVG Convert Server API endpoints.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required. For production use, consider implementing API keys or OAuth.

## Response Format

All API responses are in JSON format (except file downloads).

### Success Response
```json
{
  "taskId": "string",
  "status": "string",
  "message": "string"
}
```

### Error Response
```json
{
  "error": "string",
  "message": "string",
  "details": "string (optional)"
}
```

## Endpoints

### 1. Root Endpoint

Get server information.

**Endpoint:** `GET /`

**Response:**
```json
{
  "name": "SVG Convert Server",
  "version": "1.0.0",
  "status": "running"
}
```

---

### 2. Health Check

Check if the server is healthy and responsive.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` - Server is healthy
- `503 Service Unavailable` - Server has issues

---

### 3. Upload and Start Conversion

Upload a file and start the conversion process.

**Endpoint:** `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| file | File | ✅ Yes | - | Input file (SVG, PNG, JPG, PDF) |
| outputFormat | string | ✅ Yes | - | Output format: `png`, `jpg`, `svg`, `pdf` |
| width | integer | No | - | Output width in pixels |
| height | integer | No | - | Output height in pixels |
| quality | integer | No | 85 | JPG quality (1-100) |
| backgroundColor | string | No | transparent | Background color (hex like `#ffffff` or `transparent`) |
| maintainAspectRatio | boolean | No | true | Preserve aspect ratio |
| colors | integer | No | - | Number of colors for SVG vectorization (2-256) |
| smoothing | float | No | - | Smoothing level for SVG conversion (0.0-1.0) |

**Request Example (curl):**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@input.svg" \
  -F "outputFormat=png" \
  -F "width=1024" \
  -F "height=768" \
  -F "quality=90" \
  -F "backgroundColor=#ffffff"
```

**Request Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('outputFormat', 'png');
formData.append('width', '1024');
formData.append('quality', '90');

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Accept-Language': 'en'
  }
});

const result = await response.json();
console.log(result.taskId); // Save this for status checking
```

**Success Response (200):**
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "message": "ファイルのアップロードに成功しました"
}
```

**Error Responses:**

**400 Bad Request** - Invalid input
```json
{
  "error": "file_too_large",
  "message": "ファイルサイズが大きすぎます（最大: 20MB）"
}
```

**400 Bad Request** - Unsupported format
```json
{
  "error": "invalid_format",
  "message": "サポートされていないファイル形式です"
}
```

---

### 4. Check Conversion Status

Poll the conversion status of a task.

**Endpoint:** `GET /api/status/:taskId`

**URL Parameters:**
- `taskId` (string) - Task ID returned from upload

**Request Example:**
```bash
curl http://localhost:3000/api/status/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED"
}
```

**Status Values:**
- `PENDING` - Task is queued, waiting to start
- `PROCESSING` - Conversion is in progress
- `COMPLETED` - Conversion finished successfully
- `ERROR` - Conversion failed

**Error Response (404):**
```json
{
  "error": "task_not_found",
  "message": "タスクが見つかりません"
}
```

**Polling Strategy:**

Poll every 1-2 seconds until status is `COMPLETED` or `ERROR`:

```javascript
async function waitForCompletion(taskId) {
  while (true) {
    const response = await fetch(`http://localhost:3000/api/status/${taskId}`);
    const data = await response.json();

    if (data.status === 'COMPLETED') {
      return true;
    } else if (data.status === 'ERROR') {
      throw new Error(data.error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

### 5. Download Converted File

Download the converted file after conversion is complete.

**Endpoint:** `GET /api/download/:taskId`

**URL Parameters:**
- `taskId` (string) - Task ID returned from upload

**Request Example:**
```bash
curl -O -J http://localhost:3000/api/download/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
- Binary file data
- Headers:
  - `Content-Type`: appropriate MIME type
  - `Content-Disposition`: `attachment; filename="converted_[taskId].[ext]"`
  - `Content-Length`: file size in bytes

**JavaScript Example:**
```javascript
async function downloadFile(taskId) {
  const response = await fetch(`http://localhost:3000/api/download/${taskId}`);
  const blob = await response.blob();

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'converted.png';
  a.click();
}
```

**Error Responses:**

**400 Bad Request** - Not ready yet
```json
{
  "error": "not_ready",
  "message": "変換中...",
  "status": "PROCESSING"
}
```

**404 Not Found** - Task doesn't exist
```json
{
  "error": "task_not_found",
  "message": "タスクが見つかりません"
}
```

**404 Not Found** - File expired or deleted
```json
{
  "error": "file_not_found",
  "message": "ファイルが見つかりません"
}
```

---

### 6. Manual Cleanup

Manually delete files and task data (optional, files auto-cleanup after 30 minutes).

**Endpoint:** `DELETE /api/cleanup/:taskId`

**URL Parameters:**
- `taskId` (string) - Task ID to clean up

**Request Example:**
```bash
curl -X DELETE http://localhost:3000/api/cleanup/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "message": "Task cleaned up successfully",
  "taskId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response (404):**
```json
{
  "error": "task_not_found",
  "message": "タスクが見つかりません"
}
```

---

## Conversion Matrix

Supported conversion paths:

| Input Format | Output Format | Supported | Notes |
|--------------|---------------|-----------|-------|
| SVG | PNG | ✅ | High-quality rasterization |
| SVG | JPG | ✅ | Includes background color |
| SVG | PDF | ✅ | Vector-based PDF |
| PNG | SVG | ✅ | Uses vectorization |
| JPG | SVG | ✅ | Uses vectorization |
| PNG | JPG | ✅ | Direct conversion |
| JPG | PNG | ✅ | Direct conversion |
| PNG | PDF | ✅ | Image embedded in PDF |
| JPG | PDF | ✅ | Image embedded in PDF |

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider adding:
- Request rate limits per IP
- Concurrent conversion limits
- File size quotas

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| no_file | 400 | No file provided in upload |
| file_too_large | 400 | File exceeds size limit |
| invalid_format | 400 | Unsupported file format |
| invalid_output_format | 400 | Invalid output format specified |
| invalid_params | 400 | Invalid conversion parameters |
| not_ready | 400 | Conversion not yet complete |
| conversion_failed | 400 | Conversion error occurred |
| task_not_found | 404 | Task ID doesn't exist |
| file_not_found | 404 | File not found or expired |
| upload_failed | 500 | Upload processing failed |
| download_failed | 500 | Download processing failed |
| internal_error | 500 | Server internal error |

---

## Complete Workflow Example

```javascript
// 1. Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('outputFormat', 'png');
formData.append('width', '1024');

const uploadResponse = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});

const { taskId } = await uploadResponse.json();

// 2. Poll for completion
let completed = false;
while (!completed) {
  const statusResponse = await fetch(`http://localhost:3000/api/status/${taskId}`);
  const { status } = await statusResponse.json();

  if (status === 'COMPLETED') {
    completed = true;
  } else if (status === 'ERROR') {
    throw new Error('Conversion failed');
  } else {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 3. Download result
const downloadResponse = await fetch(`http://localhost:3000/api/download/${taskId}`);
const blob = await downloadResponse.blob();

// 4. Optional: Clean up
await fetch(`http://localhost:3000/api/cleanup/${taskId}`, {
  method: 'DELETE'
});
```

---

## Internationalization

Set the `Accept-Language` header to get localized error messages:

```bash
curl -H "Accept-Language: ja" http://localhost:3000/api/status/TASK_ID
curl -H "Accept-Language: zh" http://localhost:3000/api/status/TASK_ID
curl -H "Accept-Language: en" http://localhost:3000/api/status/TASK_ID
```

Supported languages:
- `ja` - Japanese (default)
- `zh` - Chinese
- `en` - English
