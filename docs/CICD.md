# 🚀 CounselFlow CI/CD Pipeline

## Overview

This document outlines the Continuous Integration and Continuous Deployment (CI/CD) pipeline for CounselFlow Ultimate, providing automated testing, building, security scanning, and deployment processes.

## 🏗️ Pipeline Architecture

### Workflows

1. **🔄 Continuous Integration** (`.github/workflows/ci.yml`)
   - Triggered on: Push to `main`/`develop`, Pull Requests to `main`
   - Jobs: Test Suite, Code Quality, Security Scan, Build

2. **🚀 Continuous Deployment** (`.github/workflows/cd.yml`)
   - Triggered on: Push to `main` (staging), Git tags `v*` (production)
   - Jobs: Deploy to Staging, Deploy to Production

3. **🔒 Security Scan** (`.github/workflows/security.yml`)
   - Triggered on: Weekly schedule, Push to `main`, Pull Requests
   - Jobs: Dependency Scan, Code Analysis, Container Scan, Secrets Detection

4. **📊 Performance Monitoring** (`.github/workflows/performance.yml`)
   - Triggered on: Every 6 hours, Manual trigger
   - Jobs: Lighthouse Audit, Load Testing, API Performance

## 🚦 CI Pipeline Stages

### 1. Test Suite
- **Matrix Testing**: Node.js 18.x and 20.x
- **Unit Tests**: Jest test suites for both API and Web
- **Integration Tests**: End-to-end testing
- **Coverage Reports**: Codecov integration

### 2. Code Quality
- **ESLint**: Code linting and style checks
- **Prettier**: Code formatting validation
- **TypeScript**: Type checking across all workspaces

### 3. Security Analysis
- **NPM Audit**: Dependency vulnerability scanning
- **Snyk**: Advanced security vulnerability detection
- **CodeQL**: Static code analysis
- **SonarCloud**: Code quality and security analysis
- **Trivy**: Container security scanning
- **TruffleHog**: Secrets detection

### 4. Build Process
- **API Build**: TypeScript compilation and bundling
- **Web Build**: Next.js production build
- **Docker Images**: Multi-stage container builds
- **Artifact Storage**: Build artifacts archived for 30 days

## 🚀 CD Pipeline Stages

### Staging Deployment
- **Trigger**: Push to `main` branch
- **Environment**: `staging.counselflow.com`
- **Process**:
  1. Build Docker images with staging tags
  2. Push to container registry
  3. Deploy via SSH to staging server
  4. Run health checks

### Production Deployment
- **Trigger**: Git tags matching `v*` pattern
- **Environment**: `counselflow.com`
- **Process**:
  1. Build Docker images with version tags
  2. Push to container registry with `latest` tag
  3. Deploy via SSH to production server
  4. Slack notification on completion

## 🐳 Docker Configuration

### API Container (`apps/api/Dockerfile`)
- **Base Image**: `node:20-alpine`
- **Multi-stage Build**: Separate build and production stages
- **Security**: Non-root user, health checks
- **Port**: 8000

### Web Container (`apps/web/Dockerfile`)
- **Base Image**: `node:20-alpine`
- **Next.js**: Standalone build for optimal performance
- **Security**: Non-root user, health checks
- **Port**: 3000

## 🌍 Environment Configuration

### Development
- **API**: `http://localhost:8000`
- **Web**: `http://localhost:3002`
- **Database**: SQLite (local)

### Staging
- **API**: `https://api-staging.counselflow.com`
- **Web**: `https://staging.counselflow.com`
- **Database**: PostgreSQL
- **SSL**: Let's Encrypt via Traefik

### Production
- **API**: `https://api.counselflow.com`
- **Web**: `https://counselflow.com`
- **Database**: PostgreSQL with backups
- **Monitoring**: Prometheus + Grafana
- **SSL**: Let's Encrypt via Traefik
- **Load Balancing**: Traefik with multiple replicas

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Lighthouse**: Web performance audits
- **Artillery**: Load testing for API endpoints
- **Autocannon**: API performance benchmarking

### Application Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Health Checks**: Automated endpoint monitoring

### Security Monitoring
- **Trivy**: Container vulnerability scanning
- **Snyk**: Continuous dependency monitoring
- **CodeQL**: Code security analysis

## 🔐 Secrets Management

### Required Secrets

#### Container Registry
- `DOCKER_REGISTRY`: Container registry URL
- `DOCKER_USERNAME`: Registry username
- `DOCKER_PASSWORD`: Registry password

#### Deployment
- `STAGING_HOST`: Staging server hostname
- `STAGING_USER`: SSH username for staging
- `STAGING_SSH_KEY`: SSH private key for staging
- `PRODUCTION_HOST`: Production server hostname
- `PRODUCTION_USER`: SSH username for production
- `PRODUCTION_SSH_KEY`: SSH private key for production

#### Security Tools
- `SNYK_TOKEN`: Snyk API token
- `SONAR_TOKEN`: SonarCloud token
- `CODECOV_TOKEN`: Codecov upload token

#### Application
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: JWT refresh token secret
- `DB_PASSWORD`: Database password
- `REDIS_PASSWORD`: Redis password
- `GRAFANA_PASSWORD`: Grafana admin password

#### Notifications
- `SLACK_WEBHOOK`: Slack webhook for deployment notifications

## 🚀 Deployment Commands

### Local Development
\`\`\`bash
# Start both services
npm run dev

# Build projects
npm run build

# Run tests
npm run test

# Lint and format
npm run lint
npm run format
\`\`\`

### Docker Operations
\`\`\`bash
# Build containers
npm run docker:build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
\`\`\`

### CI/CD Operations
\`\`\`bash
# Run security audit
npm run security:audit

# Run load tests
npx artillery run tests/load/load-test.yml

# Run lighthouse audit
npx lighthouse-ci --config=.lighthouserc.js
\`\`\`

## 🔄 Release Process

### Version Management
1. **Feature Development**: Work on feature branches
2. **Pull Request**: Create PR to `main` with CI checks
3. **Staging**: Merge to `main` triggers staging deployment
4. **Testing**: Validate on staging environment
5. **Release**: Create git tag `v1.x.x` for production deployment

### Tag Format
- **Major**: `v1.0.0` - Breaking changes
- **Minor**: `v1.1.0` - New features
- **Patch**: `v1.1.1` - Bug fixes

### Rollback Strategy
- **Staging**: Redeploy previous commit
- **Production**: Deploy previous tag
- **Database**: Automated backups for quick restore
- **Monitoring**: Real-time alerts for issues

## 📈 Performance Targets

### Web Performance (Lighthouse)
- **Performance**: ≥80
- **Accessibility**: ≥90
- **Best Practices**: ≥80
- **SEO**: ≥80

### API Performance
- **Response Time**: <200ms (95th percentile)
- **Throughput**: >1000 requests/second
- **Uptime**: 99.9%
- **Error Rate**: <0.1%

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review TypeScript compilation errors

#### Deployment Issues
- Validate SSH key permissions
- Check Docker registry access
- Verify environment variables

#### Performance Issues
- Review Lighthouse reports
- Analyze load test results
- Check container resource limits

### Support
- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues tracker
- **Monitoring**: Grafana dashboards
- **Logs**: Container logs via Docker

---

**Last Updated**: July 12, 2025  
**Version**: 1.0.0  
**Maintainer**: Endawoke47
