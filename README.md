# SVG Convert Server

A high-performance backend service for converting between SVG, PNG, JPG, and PDF formats. Built with Hono and Node.js, designed for deployment with Docker.

## Features

- **Bidirectional Conversion Support**
  - SVG ↔ PNG/JPG
  - Any format → PDF
  - PNG ↔ JPG

- **Conversion Options**
  - Custom dimensions (width/height)
  - Quality control (for JPG)
  - Background color configuration
  - Aspect ratio preservation
  - Color count control (for SVG vectorization)
  - Smoothing options

- **Production-Ready**
  - Automatic file cleanup (30-minute retention)
  - File size limits (20MB default)
  - Multi-language support (Japanese, Chinese, English)
  - Health check endpoints
  - Docker deployment ready

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd svgconvert-server
```

2. Build and start with Docker Compose:
```bash
docker-compose up -d
```

3. Server will be running at `http://localhost:8080`

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

4. Or build and run production:
```bash
npm run build
npm start
```

## API Documentation

### Base URL
```
http://localhost:8080
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

#### 2. Upload and Convert
```http
POST /api/upload
Content-Type: multipart/form-data
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Input file (SVG, PNG, JPG) |
| outputFormat | string | Yes | Target format: `png`, `jpg`, `svg`, `pdf` |
| width | number | No | Output width in pixels |
| height | number | No | Output height in pixels |
| quality | number | No | JPG quality (1-100), default: 85 |
| backgroundColor | string | No | Background color (hex or `transparent`) |
| maintainAspectRatio | boolean | No | Preserve aspect ratio (default: true) |
| colors | number | No | Color count for SVG vectorization |
| smoothing | number | No | Smoothing level (0-1) for SVG conversion |

**Example Request (curl):**
```bash
curl -X POST http://localhost:8080/api/upload \
  -F "file=@example.svg" \
  -F "outputFormat=png" \
  -F "width=800" \
  -F "quality=90"
```

**Response:**
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "message": "File uploaded successfully"
}
```

#### 3. Check Conversion Status
```http
GET /api/status/:taskId
```

**Response:**
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED"
}
```

**Status Values:**
- `PENDING` - Waiting for conversion
- `PROCESSING` - Currently converting
- `COMPLETED` - Conversion finished
- `ERROR` - Conversion failed

#### 4. Download Converted File
```http
GET /api/download/:taskId
```

**Response:** Binary file download

**Example:**
```bash
curl http://localhost:8080/api/download/550e8400-e29b-41d4-a716-446655440000 \
  -o converted.png
```

#### 5. Manual Cleanup
```http
DELETE /api/cleanup/:taskId
```

**Response:**
```json
{
  "message": "Task cleaned up successfully",
  "taskId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Configuration

Environment variables can be set in `.env` file or via Docker environment:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT / WEB_PORT | 8080 | Server port (PORT takes precedence) |
| NODE_ENV | development | Environment mode |
| TEMP_DIR | ./temp | Temporary file storage directory |
| MAX_FILE_SIZE | 20971520 | Maximum file size in bytes (20MB) |
| CLEANUP_INTERVAL_MINUTES | 5 | Cleanup job interval |
| FILE_RETENTION_MINUTES | 30 | File retention period |
| ALLOWED_ORIGINS | * | CORS allowed origins |

## Internationalization

The API supports multiple languages via the `Accept-Language` header:

- `ja` - Japanese (日本語) - Default
- `zh` - Chinese (中文)
- `en` - English

**Example:**
```bash
curl -H "Accept-Language: en" \
  http://localhost:8080/api/status/YOUR_TASK_ID
```

## Project Structure

```
svgconvert-server/
├── src/
│   ├── config/          # Configuration
│   ├── locales/         # i18n translations
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   └── converters/  # Conversion engines
│   ├── types/           # TypeScript types
│   └── utils/           # Helper functions
├── docs/                # Documentation
├── Dockerfile           # Docker image definition
├── docker-compose.yml   # Docker Compose configuration
└── package.json         # Dependencies
```

## Technologies Used

- **Framework:** [Hono](https://hono.dev/) - Ultra-fast web framework
- **Runtime:** Node.js 20+
- **Image Processing:**
  - Sharp - High-performance image processing
  - Resvg - SVG rendering
  - Potrace - Image vectorization
- **PDF Generation:** pdf-lib
- **Scheduling:** node-cron
- **Language:** TypeScript

## Development

### Build
```bash
npm run build
```

### Run Tests (if available)
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Docker Deployment

### Build Image
```bash
docker build -t svgconvert-server .
```

### Run Container
```bash
docker run -d \
  -p 8080:8080 \
  --name svgconvert-server \
  svgconvert-server
```

### Using Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Performance

- 90% of conversions complete within 10 seconds
- Automatic cleanup prevents disk space issues
- Optimized Docker image with multi-stage build
- Non-root user for enhanced security

## Security Features

- File size validation (max 20MB)
- MIME type verification
- Automatic file cleanup (30-minute retention)
- Non-root Docker user
- CORS configuration support

## License

MIT

## Support

For issues and feature requests, please refer to the documentation in the `/docs` folder or contact the development team.
