#!/bin/bash

# CounselFlow Neo Production Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 CounselFlow Neo Deployment Script${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check if required commands are available
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is required but not installed.${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
check_command "node"
check_command "npm"
check_command "docker"
check_command "docker-compose"

# Check Node version
NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Environment validation
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}🔍 Validating production environment...${NC}"
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ .env file not found. Copy .env.example and configure it.${NC}"
        exit 1
    fi
    
    # Check for required environment variables
    required_vars=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            echo -e "${RED}❌ Required environment variable $var not found in .env${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
fi

echo ""

# Pre-deployment checks
echo -e "${YELLOW}🧪 Running pre-deployment checks...${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build applications
echo -e "${YELLOW}🏗️ Building applications...${NC}"
cd apps/api
npm run build
cd ../../

cd apps/web
npm run build
cd ../../

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
cd apps/api
npm test
cd ../../

echo -e "${GREEN}✅ All tests passed${NC}"

# Database setup
echo -e "${YELLOW}🗄️ Setting up database...${NC}"
cd apps/api

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}Running production database migrations...${NC}"
    npx prisma migrate deploy
else
    echo -e "${YELLOW}Running development database migrations...${NC}"
    npx prisma migrate dev --name "deployment-$(date +%Y%m%d-%H%M%S)"
fi

npx prisma generate
cd ../../

echo -e "${GREEN}✅ Database setup completed${NC}"

# Deploy with Docker
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}🐳 Deploying with Docker (Production)...${NC}"
    
    # Build and start production services
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 30
    
    # Health check
    echo -e "${YELLOW}🏥 Performing health check...${NC}"
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Health check passed${NC}"
            break
        else
            echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - waiting for API...${NC}"
            sleep 5
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        echo -e "${RED}❌ Health check failed after $max_attempts attempts${NC}"
        echo -e "${YELLOW}📝 Checking logs...${NC}"
        docker-compose -f docker-compose.prod.yml logs --tail=50 counselflow-api
        exit 1
    fi
    
    # Show running services
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}📊 Running services:${NC}"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo -e "${GREEN}🌐 Application URLs:${NC}"
    echo -e "${GREEN}  API Health: http://localhost:8000/health${NC}"
    echo -e "${GREEN}  API Docs:   http://localhost:8000/api${NC}"
    echo -e "${GREEN}  Web App:    http://localhost:3000${NC}"
    
else
    echo -e "${YELLOW}🔧 Starting development environment...${NC}"
    echo -e "${GREEN}✅ Build completed. Start development with:${NC}"
    echo -e "${GREEN}  cd apps/api && npm run dev${NC}"
    echo -e "${GREEN}  cd apps/web && npm run dev${NC}"
fi

echo ""
echo -e "${GREEN}📋 Post-deployment checklist:${NC}"
echo -e "${GREEN}  [ ] Verify all services are running${NC}"
echo -e "${GREEN}  [ ] Check application logs${NC}"
echo -e "${GREEN}  [ ] Test authentication flow${NC}"
echo -e "${GREEN}  [ ] Verify database connectivity${NC}"
echo -e "${GREEN}  [ ] Test API endpoints${NC}"
echo -e "${GREEN}  [ ] Check security headers${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${GREEN}  [ ] Set up monitoring and alerts${NC}"
    echo -e "${GREEN}  [ ] Configure backup procedures${NC}"
    echo -e "${GREEN}  [ ] Update DNS records (if needed)${NC}"
    echo -e "${GREEN}  [ ] Configure SSL certificates${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CounselFlow Neo deployment completed!${NC}"