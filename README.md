# CounselFlow Neo - Production Ready

Enterprise-grade legal management platform with AI capabilities for 71 global jurisdictions.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, recommended for production)
- Docker & Docker Compose (for containerized deployment)

### Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/Endawoke47/Neo.git
   cd Neo
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   cd apps/api
   npx prisma generate
   npx prisma migrate dev
   npx prisma seed
   ```

4. **Start Development**
   ```bash
   # Terminal 1: API Server
   cd apps/api
   npm run dev

   # Terminal 2: Web Application  
   cd apps/web
   npm run dev
   ```

5. **Access Application**
   - **API**: http://localhost:8000
   - **Web App**: http://localhost:3000
   - **Health Check**: http://localhost:8000/health

## 🐳 Production Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale counselflow-api=2
```

### Manual Production Deployment

1. **Build Applications**
   ```bash
   cd apps/api
   npm run build

   cd ../web
   npm run build
   ```

2. **Database Migration**
   ```bash
   cd apps/api
   npx prisma migrate deploy
   ```

3. **Start Production Services**
   ```bash
   cd apps/api
   npm run start:prod
   ```

## 🔧 Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/counselflow_neo

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-64-chars-min
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-64-chars-min

# Application
NODE_ENV=production
PORT=8000
```

### Optional Environment Variables

```bash
# Redis (recommended for production)
REDIS_URL=redis://localhost:6379

# AI Services (optional)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Email (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔐 Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: Configurable request limiting
- **Security Headers**: Helmet.js protection
- **Input Validation**: Zod schema validation
- **Password Security**: bcrypt hashing
- **CORS**: Configurable origins
- **Request Logging**: Comprehensive audit trails

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
cd apps/api
npm test

cd apps/web  
npm test
```

## 📊 Health Monitoring

### Health Check Endpoints

- **Basic Health**: `GET /health`
- **Deep Health**: `GET /api/health/deep`
- **Readiness**: `GET /api/health/ready` (Kubernetes)
- **Liveness**: `GET /api/health/live` (Kubernetes)
- **Metrics**: `GET /api/health/metrics`

### Example Health Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-19T10:30:00Z",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600.45
  }
}
```

## 🏗️ Architecture

### Backend (API)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access
- **Validation**: Zod schemas
- **Logging**: Winston with rotation
- **Caching**: Redis (optional)

### Frontend (Web)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **UI Components**: Radix UI primitives
- **Validation**: React Hook Form + Zod

### AI Capabilities
- **Providers**: Ollama (self-hosted), OpenAI, Anthropic
- **Features**: Contract analysis, legal research, risk assessment
- **Jurisdictions**: 71 countries (54 African + 17 Middle Eastern)
- **Languages**: 10 supported languages

## 📁 Project Structure

```
Neo/
├── apps/
│   ├── api/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── config/      # Configuration files
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── routes/      # API routes
│   │   │   └── index.ts     # Server entry point
│   │   ├── prisma/          # Database schema & migrations
│   │   └── Dockerfile       # API container
│   └── web/                 # Next.js web application
│       ├── src/
│       │   ├── app/         # Next.js app router
│       │   ├── components/  # React components
│       │   └── lib/         # Utilities
│       └── Dockerfile       # Web container
├── packages/                # Shared packages
├── .env.example            # Environment template
├── docker-compose.prod.yml # Production compose
└── README.md              # This file
```

## 🚨 Production Checklist

### Before Deployment
- [ ] Set strong JWT secrets (64+ characters)
- [ ] Configure production database
- [ ] Set up Redis for caching
- [ ] Configure SMTP for emails
- [ ] Set CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backups

### Security Hardening
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up proper CORS
- [ ] Configure security headers
- [ ] Set up log rotation
- [ ] Enable audit logging
- [ ] Configure firewall

### Performance Optimization
- [ ] Set up database connection pooling
- [ ] Configure Redis caching
- [ ] Enable compression
- [ ] Set up CDN for static assets
- [ ] Configure load balancing
- [ ] Monitor application metrics

## 📝 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/login       # User login
POST /api/auth/register    # User registration  
POST /api/auth/refresh     # Refresh access token
POST /api/auth/logout      # Logout user
GET  /api/auth/me          # Get current user
```

### Example Login Request

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check DATABASE_URL in .env
   # Ensure PostgreSQL is running
   # Verify database exists
   ```

2. **JWT Token Error**
   ```bash
   # Check JWT_SECRET is set
   # Ensure secret is 64+ characters in production
   # Verify token hasn't expired
   ```

3. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear build caches
   npm run clean
   npm run build
   ```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Endawoke47/Neo/issues)
- **Documentation**: See `/docs` directory
- **Security**: Report security issues responsibly

## 📄 License

Proprietary - All rights reserved

---

**CounselFlow Neo** - Enterprise Legal Management Platform  
*Empowering legal professionals with AI-powered practice management*