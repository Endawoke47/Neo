# A+++++ Production Dockerfile
# Multi-stage build optimized for A+++++ architecture
FROM node:20-alpine AS base

# Install security updates and required dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tini && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files for better Docker layer caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Dependency installation stage
FROM base AS deps
RUN npm ci --only=production && \
    npm cache clean --force

# Development dependencies for building
FROM base AS dev-deps
COPY . .
RUN npm ci

# Build stage
FROM dev-deps AS builder
WORKDIR /app/apps/api

# Generate Prisma client for A+++++ architecture
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Production stage - A+++++ optimized
FROM node:20-alpine AS production

# Install runtime security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Set production environment
ENV NODE_ENV=production
ENV PORT=8000

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S counselflow -u 1001

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/prisma ./prisma

# Create logs directory for A+++++ architecture
RUN mkdir -p logs cache && \
    chown -R counselflow:nodejs /app

# Switch to non-root user
USER counselflow

# A+++++ Health check with comprehensive monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

# Expose port
EXPOSE $PORT

# Use dumb-init to handle signals properly in A+++++ architecture
ENTRYPOINT ["dumb-init", "--"]

# Start the A+++++ application
CMD ["node", "dist/index.js"]
