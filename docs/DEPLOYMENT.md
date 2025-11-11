# Deployment Guide

This guide covers deploying the SVG Convert Server using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 1GB RAM
- 5GB free disk space

## Quick Deploy with Docker Compose

### 1. Prepare the Environment

Clone or copy the project to your server:

```bash
cd /opt
git clone <repository-url> svgconvert-server
cd svgconvert-server
```

### 2. Configure Environment Variables

Edit `docker-compose.yml` or create a `.env` file:

```env
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=20971520
CLEANUP_INTERVAL_MINUTES=5
FILE_RETENTION_MINUTES=30
ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Build and Start

```bash
# Build and start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f svgconvert-server

# Check status
docker-compose ps
```

### 4. Verify Deployment

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok"}
```

## Manual Docker Deployment

### Build the Image

```bash
docker build -t svgconvert-server:latest .
```

### Run the Container

```bash
docker run -d \
  --name svgconvert-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MAX_FILE_SIZE=20971520 \
  -e ALLOWED_ORIGINS="*" \
  --restart unless-stopped \
  svgconvert-server:latest
```

### Check Container Status

```bash
# View logs
docker logs -f svgconvert-server

# Check health
docker inspect svgconvert-server | grep Health
```

## Production Best Practices

### 1. Use Reverse Proxy

Use Nginx or Traefik as a reverse proxy:

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name convert.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Increase upload size limit
        client_max_body_size 20M;
    }
}
```

### 2. Enable HTTPS

Use Let's Encrypt with Certbot:

```bash
sudo certbot --nginx -d convert.yourdomain.com
```

### 3. Resource Limits

Limit container resources in `docker-compose.yml`:

```yaml
services:
  svgconvert-server:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 4. Monitoring

Add health check monitoring:

```bash
# Simple health check script
#!/bin/bash
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Health check failed!"
    docker-compose restart svgconvert-server
fi
```

Set up as a cron job:
```bash
*/5 * * * * /path/to/health-check.sh
```

### 5. Backup and Updates

**Update the service:**

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

**Zero-downtime update:**

```bash
docker-compose up -d --no-deps --build svgconvert-server
```

## Scaling

### Horizontal Scaling

Run multiple instances behind a load balancer:

```yaml
version: '3.8'

services:
  svgconvert-server:
    # ... config
    deploy:
      replicas: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - svgconvert-server
```

**Nginx load balancer config:**

```nginx
upstream svgconvert {
    least_conn;
    server svgconvert-server:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    location / {
        proxy_pass http://svgconvert;
    }
}
```

## Cloud Deployment

### AWS ECS

1. Create ECR repository:
```bash
aws ecr create-repository --repository-name svgconvert-server
```

2. Push image:
```bash
docker tag svgconvert-server:latest YOUR_ECR_URL/svgconvert-server:latest
docker push YOUR_ECR_URL/svgconvert-server:latest
```

3. Create ECS task definition and service

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/svgconvert-server

# Deploy
gcloud run deploy svgconvert-server \
  --image gcr.io/PROJECT_ID/svgconvert-server \
  --platform managed \
  --port 3000 \
  --memory 2Gi \
  --max-instances 10
```

### Azure Container Instances

```bash
# Create resource group
az group create --name svgconvert-rg --location eastus

# Deploy container
az container create \
  --resource-group svgconvert-rg \
  --name svgconvert-server \
  --image YOUR_REGISTRY/svgconvert-server:latest \
  --cpu 2 \
  --memory 2 \
  --ports 3000 \
  --environment-variables NODE_ENV=production
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose logs svgconvert-server
```

Common issues:
- Port 3000 already in use
- Insufficient memory
- Missing dependencies

### High memory usage

Adjust file retention:
```env
FILE_RETENTION_MINUTES=15
CLEANUP_INTERVAL_MINUTES=3
```

### Slow conversions

- Increase CPU allocation
- Check disk I/O
- Monitor system resources:
```bash
docker stats svgconvert-server
```

## Security Checklist

- [ ] Enable HTTPS
- [ ] Configure CORS properly (don't use `*` in production)
- [ ] Set up firewall rules
- [ ] Limit file upload size
- [ ] Enable rate limiting (consider using nginx)
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Use secrets management for sensitive configs

## Maintenance

### View Logs

```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Service

```bash
docker-compose restart svgconvert-server
```

### Update Dependencies

```bash
# Inside container
docker-compose exec svgconvert-server npm update

# Or rebuild
docker-compose build --no-cache
```

### Clean Up Old Images

```bash
docker image prune -a
```

## Performance Tuning

### Node.js Optimization

Set environment variables:

```yaml
environment:
  - NODE_ENV=production
  - UV_THREADPOOL_SIZE=128
  - NODE_OPTIONS=--max-old-space-size=4096
```

### File System

Use volume mount for temp directory:

```yaml
volumes:
  - /fast/ssd/path:/app/temp
```

## Monitoring Setup

### Prometheus + Grafana

Add monitoring to docker-compose:

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

## Support

For deployment issues, check:
- Docker logs: `docker-compose logs`
- System resources: `docker stats`
- Health endpoint: `curl http://localhost:3000/health`
- API status: `curl http://localhost:3000/`
