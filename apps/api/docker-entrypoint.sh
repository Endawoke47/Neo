#!/bin/sh

# Production Docker Entrypoint Script
# Handles initialization, health checks, and graceful shutdown

set -e

echo "🚀 Starting CounselFlow Neo API in production mode..."

# Environment validation
if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET is required in production"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is required"
    exit 1
fi

# Print startup information
echo "📋 Environment: $NODE_ENV"
echo "📦 Node.js version: $(node --version)"
echo "🆔 Process ID: $$"
echo "👤 Running as user: $(whoami)"
echo "📁 Working directory: $(pwd)"

# Create necessary directories
mkdir -p logs

# Database migration check (if applicable)
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Running database migrations..."
    npm run prisma:migrate || {
        echo "❌ Database migration failed"
        exit 1
    }
fi

# Database seed check (if applicable)
if [ "$RUN_SEEDS" = "true" ]; then
    echo "🌱 Running database seeds..."
    npm run prisma:seed || {
        echo "⚠️ Database seeding failed, continuing..."
    }
fi

# Validate critical services before starting
echo "🔍 Validating services..."

# Test database connection (placeholder)
if [ "$DATABASE_URL" ]; then
    echo "✅ Database URL configured"
fi

# Test AI service keys
if [ "$OPENAI_API_KEY" ]; then
    echo "✅ OpenAI API key configured"
fi

if [ "$ANTHROPIC_API_KEY" ]; then
    echo "✅ Anthropic API key configured"
fi

# Pre-warm the application (optional)
if [ "$PREWARM_APP" = "true" ]; then
    echo "🔥 Pre-warming application..."
    # Add any pre-warming logic here
fi

# Set up signal handlers for graceful shutdown
trap 'echo "🛑 Received SIGTERM, shutting down gracefully..."; kill -TERM $PID; wait $PID' TERM
trap 'echo "🛑 Received SIGINT, shutting down gracefully..."; kill -INT $PID; wait $PID' INT

# Start the application
echo "🎯 Starting server..."
node dist/index.js &
PID=$!

# Wait for the process to finish
wait $PID

echo "👋 Application shutdown complete"