# CounselFlow Neo API Production Dockerfile
# Multi-stage build optimized for production deployment
FROM node:20-alpine AS base

# Install security updates and required dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY turbo.json ./

# Dependencies stage - production only
FROM base AS deps
COPY apps/api/package*.json ./apps/api/
RUN cd apps/api && npm ci --only=production && npm cache clean --force

# Build dependencies stage - includes dev dependencies
FROM base AS build-deps
COPY apps/api/package*.json ./apps/api/
RUN cd apps/api && npm ci

# Build stage
FROM build-deps AS builder
COPY apps/api/ ./apps/api/
WORKDIR /app/apps/api

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS production

# Install runtime dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/* && \
    npm install -g pm2

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV NPM_CONFIG_PRODUCTION=true

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S counselflow -u 1001 -G nodejs

# Copy production dependencies
COPY --from=deps --chown=counselflow:nodejs /app/apps/api/node_modules ./node_modules

# Copy built application and necessary files
COPY --from=builder --chown=counselflow:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=counselflow:nodejs /app/apps/api/package*.json ./
COPY --from=builder --chown=counselflow:nodejs /app/apps/api/prisma ./prisma

# Create necessary directories with proper permissions
RUN mkdir -p logs tmp uploads && \
    chown -R counselflow:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER counselflow

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Expose port
EXPOSE $PORT

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application with PM2 for production
CMD ["pm2-runtime", "start", "dist/index.js", "--name", "counselflow-api"]
