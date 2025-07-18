/**
 * Enhanced OpenAPI/Swagger Documentation Configuration - A+++++ API Documentation
 * Comprehensive interactive API documentation for CounselFlow API
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';
import { env } from './environment';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CounselFlow API - A+++++ Architecture',
    version: process.env.npm_package_version || '1.0.0',
    description: `
# CounselFlow API Documentation

Welcome to the **CounselFlow API** - an enterprise-grade legal practice management platform with AI-powered capabilities.

## 🚀 A+++++ Architecture Features

- **Command & Policy Pattern**: Advanced CQRS-style architecture
- **AI-Powered Legal Services**: Contract analysis, legal research across 71 jurisdictions
- **Enterprise Security**: Role-based access control with audit logging
- **Performance Optimized**: Circuit breaker patterns and intelligent caching
- **Comprehensive Validation**: Input sanitization and business rule enforcement

## 🔐 Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### Rate Limits

- **Standard endpoints**: 100 requests/minute
- **AI endpoints**: 10 requests/minute  
- **Authentication**: 5 requests/minute

## 📊 Response Format

All responses follow a consistent format:

\`\`\`json
{
  "success": true|false,
  "data": {...},
  "message": "Operation description",
  "commandId": "uuid-for-command-tracking"
}
\`\`\`

## 🎯 Key Capabilities

- **Client Management**: Complete CRM for legal clients
- **Matter Management**: Case tracking and legal matter oversight
- **Contract Intelligence**: AI-powered contract analysis and risk assessment
- **Legal Research**: Multi-jurisdiction legal research with AI
- **Document Automation**: AI-driven document generation
- **Dispute Management**: Litigation tracking and resolution
- **Compliance Monitoring**: Automated regulatory compliance checks

## 🔄 Command Pattern Integration

This API implements the Command Pattern for all write operations, providing:
- **Audit trails** for all business operations
- **Idempotent operations** with command IDs
- **Policy-based authorization** for enhanced security
- **Rollback capabilities** for critical operations
    `,
    contact: {
      name: 'CounselFlow Support',
      email: 'support@counselflow.com',
      url: 'https://counselflow.com/support'
    },
    license: {
      name: 'Proprietary',
      url: 'https://counselflow.com/license',
    },
    termsOfService: 'https://counselflow.com/terms'
  },
  servers: [
    {
      url: env.NODE_ENV === 'production' 
        ? 'https://api.counselflow.com/api/v1' 
        : `http://localhost:${env.PORT}/api/v1`,
      description: env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login endpoint',
      },
      RefreshToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Refresh token for obtaining new access tokens',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'LAWYER', 'PARALEGAL', 'CLIENT'],
            description: 'User role in the system',
            example: 'LAWYER',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
            description: 'User account status',
            example: 'ACTIVE',
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last account update timestamp',
          },
        },
        required: ['id', 'email', 'firstName', 'lastName', 'role', 'status'],
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token for API authentication',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token for obtaining new access tokens',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          expiresIn: {
            type: 'integer',
            description: 'Access token expiration time in seconds',
            example: 86400,
          },
        },
        required: ['accessToken', 'refreshToken', 'expiresIn'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'User password',
            example: 'SecurePassword123!',
          },
          rememberMe: {
            type: 'boolean',
            description: 'Whether to extend session duration',
            example: false,
          },
        },
        required: ['email', 'password'],
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'User password (min 8 chars, must contain uppercase, lowercase, number, special char)',
            example: 'SecurePassword123!',
          },
          confirmPassword: {
            type: 'string',
            format: 'password',
            description: 'Password confirmation',
            example: 'SecurePassword123!',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
        },
        required: ['email', 'password', 'confirmPassword', 'firstName', 'lastName'],
      },
      PasswordResetRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address for password reset',
            example: 'john.doe@example.com',
          },
        },
        required: ['email'],
      },
      RefreshTokenRequest: {
        type: 'object',
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Valid refresh token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
        required: ['refreshToken'],
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful',
          },
          message: {
            type: 'string',
            description: 'Human-readable response message',
          },
          data: {
            type: 'object',
            description: 'Response data payload',
          },
          error: {
            type: 'string',
            description: 'Error message (present when success is false)',
          },
        },
        required: ['success'],
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Validation failed',
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email',
                },
                message: {
                  type: 'string',
                  example: 'Invalid email format',
                },
              },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                error: {
                  type: 'string',
                  example: 'Authentication required',
                },
              },
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access forbidden',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                error: {
                  type: 'string',
                  example: 'Access forbidden',
                },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                error: {
                  type: 'string',
                  example: 'Resource not found',
                },
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                error: {
                  type: 'string',
                  example: 'Too many requests, please try again later',
                },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                error: {
                  type: 'string',
                  example: 'Internal server error',
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Clients',
      description: 'Client management endpoints',
    },
    {
      name: 'Matters',
      description: 'Legal matter management endpoints',
    },
    {
      name: 'Documents',
      description: 'Document management endpoints',
    },
    {
      name: 'Contracts',
      description: 'Contract management endpoints',
    },
    {
      name: 'Disputes',
      description: 'Dispute management endpoints',
    },
    {
      name: 'Reports',
      description: 'Reporting and analytics endpoints',
    },
    {
      name: 'AI',
      description: 'AI-powered features and automation endpoints',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts', // Include all route files
    './src/middleware/*.ts', // Include middleware for additional documentation
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
