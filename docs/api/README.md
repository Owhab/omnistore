# API Documentation

Welcome to the API documentation for the **Omnistore API** - a NestJS-based backend service providing authentication, user management, and profile services.

## Table of Contents

- [Overview](#overview)
- [Getting Started](./getting-started.md)
- [Architecture](./architecture.md)
- [Authentication](./authentication.md)
- [API Endpoints](./endpoints.md)
- [Configuration](./configuration.md)
- [Database](./database.md)
- [Services](./services.md)
- [**Developer Guide**](./DEVELOPER_GUIDE.md) - Complete guide with examples for all boilerplate features

## Overview

The API is built using [NestJS](https://nestjs.com/) v11, a progressive Node.js framework for building efficient and scalable server-side applications. It follows a modular architecture with clear separation of concerns.

### Key Features

- 🔐 **JWT Authentication** - Secure token-based authentication with encrypted tokens
- 👥 **Role-Based Access Control (RBAC)** - Fine-grained permissions using decorators
- 📝 **Swagger API Documentation** - Auto-generated API docs available in development mode
- 🗄️ **PostgreSQL Database** - TypeORM integration with migrations and seeding support
- 📧 **Email Service** - Handlebars-based email templates with SMTP support
- 🔄 **Background Jobs** - BullMQ-powered job queues with Redis
- 🛡️ **Security** - Helmet, CORS, rate limiting, and input validation
- ✅ **Validation** - Class-validator based request validation with custom decorators

### Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS 11 | Backend Framework |
| TypeORM | Database ORM |
| PostgreSQL | Database |
| Redis | Caching & Job Queues |
| BullMQ | Background Job Processing |
| JWT | Authentication |
| Swagger | API Documentation |
| Handlebars | Email Templates |

## Quick Links

- **Swagger UI**: Available at `/api-doc` in development mode
- **API Version**: v1 (URI versioning at `/v1/*`)
- **Default Port**: 4000

## Project Structure

```
apps/api/
├── database/
│   ├── data-source.ts          # TypeORM data source configuration
│   ├── migrations/             # Database migrations
│   └── seeds/                  # Database seeders
├── src/
│   ├── common/                 # Shared base classes
│   ├── config/                 # Configuration schemas
│   ├── constants/              # Enums and constants
│   ├── decorators/             # Custom decorators
│   ├── exceptions/             # Custom exception classes
│   ├── filters/                # Exception filters
│   ├── guards/                 # Authentication & authorization guards
│   ├── interceptors/           # Response interceptors
│   ├── middleware/             # Custom middleware
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Authentication module
│   │   ├── profile/            # User profile module
│   │   ├── queue/              # Background jobs module
│   │   └── user/               # User entity module
│   ├── pipes/                  # Validation pipes
│   ├── redis/                  # Redis service module
│   ├── shared/                 # Shared services module
│   ├── templates/              # Email templates
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── test/                       # E2E tests
├── .env.example                # Environment variables template
└── package.json                # Dependencies and scripts
```

## Next Steps

1. [Getting Started](./getting-started.md) - Set up your development environment
2. [Configuration](./configuration.md) - Configure environment variables
3. [Authentication](./authentication.md) - Understand the auth system
4. [API Endpoints](./endpoints.md) - Explore available endpoints
5. [**Developer Guide**](./DEVELOPER_GUIDE.md) - **Start here for development!** Complete guide with code examples
