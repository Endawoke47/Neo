# Use official Node.js runtime as base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/api/ ./apps/api/

# Build the application
FROM base AS builder
RUN npm run build --workspace=@counselflow/api

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S counselflow -u 1001

# Change ownership of the app directory
RUN chown -R counselflow:nodejs /app
USER counselflow

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
