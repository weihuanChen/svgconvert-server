# Multi-stage build for smaller image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (force dev deps for tooling like TypeScript)
RUN npm install --include=dev

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Install necessary system dependencies for Sharp and image processing
RUN apk add --no-cache \
    cairo \
    pango \
    giflib \
    pixman \
    libjpeg-turbo \
    libpng \
    librsvg

WORKDIR /app

# Copy package files
COPY package*.json ./

ENV NODE_ENV=production

# Install production dependencies only (omit dev deps)
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy locales
COPY src/locales ./dist/locales

# Create temp directory
RUN mkdir -p /app/temp && \
    chown -R node:node /app

# Use non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
