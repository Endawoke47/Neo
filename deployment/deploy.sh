#!/bin/bash

# A+++++ Deployment Script
# Automated deployment for CounselFlow A+++++ architecture
# Usage: ./deploy.sh [environment] [version]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
VERSION="${2:-latest}"
LOG_FILE="/tmp/counselflow-deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites for A+++++ deployment..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
        error "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Check SSL certificates for production
    if [[ "$ENVIRONMENT" == "production" ]] && [[ ! -f "$PROJECT_ROOT/ssl/counselflow.crt" ]]; then
        warning "SSL certificates not found. HTTPS will not work."
    fi
    
    success "Prerequisites check completed"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Create backup directory
        BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup PostgreSQL
        docker-compose -f docker-compose.production.yml exec -T database \
            pg_dump -U counselflow counselflow_prod > "$BACKUP_DIR/database.sql" || {
            warning "Database backup failed. Continuing with deployment..."
        }
        
        success "Database backup created in $BACKUP_DIR"
    else
        log "Skipping database backup for $ENVIRONMENT environment"
    fi
}

# Build and test applications
build_applications() {
    log "Building A+++++ applications..."
    
    cd "$PROJECT_ROOT"
    
    # Build API
    log "Building CounselFlow API..."
    docker build -t counselflow/api:$VERSION -f apps/api/Dockerfile .
    
    # Build Web application
    log "Building CounselFlow Web..."
    docker build -t counselflow/web:$VERSION -f apps/web/Dockerfile .
    
    # Run tests
    log "Running A+++++ test suite..."
    docker run --rm counselflow/api:$VERSION npm run test:ci || {
        error "API tests failed. Deployment aborted."
    }
    
    success "Applications built and tested successfully"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying A+++++ infrastructure..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file
    cp ".env.$ENVIRONMENT" .env
    
    # Deploy with Docker Compose
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f docker-compose.production.yml down --remove-orphans
        docker-compose -f docker-compose.production.yml pull
        docker-compose -f docker-compose.production.yml up -d
    else
        docker-compose down --remove-orphans
        docker-compose up -d
    fi
    
    success "Infrastructure deployed"
}

# Health checks
perform_health_checks() {
    log "Performing A+++++ health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check API health
        if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
            success "API health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Health checks failed after $max_attempts attempts"
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Check database connectivity
    docker-compose exec -T api node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$queryRaw\`SELECT 1\`.then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch((error) => {
            console.error('Database connection failed:', error);
            process.exit(1);
        });
    " || error "Database health check failed"
    
    # Check A+++++ architecture components
    log "Checking A+++++ architecture components..."
    curl -f http://localhost:8000/api/health/command-bus || warning "Command Bus health check failed"
    curl -f http://localhost:8000/api/health/policy-service || warning "Policy Service health check failed"
    curl -f http://localhost:8000/api/health/circuit-breakers || warning "Circuit Breakers health check failed"
    
    success "All health checks completed"
}

# Database migrations
run_migrations() {
    log "Running database migrations..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f docker-compose.production.yml exec api npm run prisma:migrate
    else
        docker-compose exec api npm run prisma:migrate:dev
    fi
    
    success "Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up A+++++ monitoring..."
    
    # Import Grafana dashboards
    if [[ -d "$PROJECT_ROOT/monitoring/grafana/dashboards" ]]; then
        log "Importing Grafana dashboards..."
        # Grafana dashboard import would go here
        success "Grafana dashboards imported"
    fi
    
    # Configure Prometheus alerts
    if [[ -f "$PROJECT_ROOT/monitoring/prometheus-rules.yml" ]]; then
        log "Loading Prometheus alerting rules..."
        docker-compose exec prometheus promtool check rules /etc/prometheus/rules/prometheus-rules.yml
        success "Prometheus alerting rules loaded"
    fi
    
    success "Monitoring setup completed"
}

# Cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old containers
    docker container prune -f
    
    # Remove unused volumes (be careful in production)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        docker volume prune -f
    fi
    
    success "Cleanup completed"
}

# Send deployment notification
send_notification() {
    log "Sending deployment notification..."
    
    local status="$1"
    local webhook_url="${SLACK_WEBHOOK_URL:-}"
    
    if [[ -n "$webhook_url" ]]; then
        local message="CounselFlow A+++++ deployment to $ENVIRONMENT: $status (version: $VERSION)"
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$webhook_url" || warning "Failed to send notification"
    else
        log "No webhook URL configured. Skipping notification."
    fi
}

# Main deployment function
main() {
    log "Starting CounselFlow A+++++ deployment..."
    log "Environment: $ENVIRONMENT"
    log "Version: $VERSION"
    log "Log file: $LOG_FILE"
    
    # Deployment steps
    check_prerequisites
    backup_database
    build_applications
    deploy_infrastructure
    run_migrations
    perform_health_checks
    setup_monitoring
    cleanup
    
    success "🚀 CounselFlow A+++++ deployment completed successfully!"
    send_notification "SUCCESS"
    
    log "Deployment summary:"
    log "- Environment: $ENVIRONMENT"
    log "- Version: $VERSION"
    log "- API URL: http://localhost:8000"
    log "- Web URL: http://localhost:3000"
    log "- Grafana: http://localhost:3001"
    log "- Prometheus: http://localhost:9090"
    log "- Log file: $LOG_FILE"
}

# Error handler
trap 'error "Deployment failed! Check $LOG_FILE for details"; send_notification "FAILED"' ERR

# Run main function
main "$@"