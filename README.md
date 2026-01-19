# Omnistore

A full-stack monorepo application featuring a NestJS API, React Native mobile app, React dashboard, and Next.js web application.

## 🏗️ Project Structure

```
omnistore/
├── apps/
│   ├── api/          # NestJS Backend API
│   ├── app/          # React Native Mobile App (Expo)
│   ├── dashboard/    # React Admin Dashboard (Vite)
│   └── web/          # Next.js Web Application
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
└── docs/
    └── api/          # API Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or later
- **pnpm** v10.25.0 or later
- **PostgreSQL** v14 or later (for API)
- **Redis** v6 or later (for API)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd omnistore

# Install dependencies
pnpm install
```

### Running Applications

```bash
# Run all applications in development mode
pnpm run dev

# Build all applications
pnpm run build

# Lint all applications
pnpm run lint
```

## 📦 Applications

### API (`apps/api`)

A NestJS-based REST API providing authentication, user management, and backend services.

**Features:**
- 🔐 JWT Authentication with encrypted tokens
- 👥 Role-Based Access Control (RBAC)
- 📝 Swagger API Documentation
- 🗄️ PostgreSQL with TypeORM
- 📧 Email service with Handlebars templates
- 🔄 Background jobs with BullMQ & Redis
- 🛡️ Security (Helmet, CORS, rate limiting)

**Quick Start:**
```bash
cd apps/api
cp .env.example .env
# Configure your .env file
pnpm run start:dev
```

**Documentation:** See [docs/api/](./docs/api/README.md) for detailed API documentation.

---

### Mobile App (`apps/app`)

A React Native mobile application built with Expo.

**Quick Start:**
```bash
cd apps/app
pnpm run start
```

---

### Dashboard (`apps/dashboard`)

A React-based admin dashboard built with Vite.

**Quick Start:**
```bash
cd apps/dashboard
pnpm run dev
```

---

### Web (`apps/web`)

A Next.js web application.

**Quick Start:**
```bash
cd apps/web
pnpm run dev
```

## 📚 Documentation

- [API Documentation](./docs/api/README.md)
  - [Getting Started](./docs/api/getting-started.md)
  - [Configuration](./docs/api/configuration.md)
  - [Architecture](./docs/api/architecture.md)
  - [Authentication](./docs/api/authentication.md)
  - [API Endpoints](./docs/api/endpoints.md)
  - [Database](./docs/api/database.md)
  - [Services](./docs/api/services.md)
  - [**Developer Guide**](./docs/api/DEVELOPER_GUIDE.md) ⭐ - Complete guide with code examples for all features

## 🛠️ Tech Stack

| Application | Technologies |
|-------------|-------------|
| **API** | NestJS, TypeORM, PostgreSQL, Redis, BullMQ, JWT |
| **Mobile App** | React Native, Expo |
| **Dashboard** | React, Vite, TypeScript |
| **Web** | Next.js, React, TypeScript, Tailwind CSS |

## 📁 Shared Packages

### `packages/types`

Shared TypeScript type definitions used across applications.

### `packages/ui`

Shared UI components that can be used in web and dashboard applications.

## 🔧 Development

### Package Manager

This project uses [pnpm](https://pnpm.io/) as the package manager with workspace support.

### Monorepo Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start all apps in development mode |
| `pnpm run build` | Build all applications |
| `pnpm run lint` | Lint all applications |
| `pnpm run test` | Run tests across all apps |

### Working with Individual Apps

Navigate to the specific app directory and use its scripts:

```bash
# API
cd apps/api
pnpm run start:dev

# Dashboard
cd apps/dashboard
pnpm run dev

# Web
cd apps/web
pnpm run dev

# Mobile
cd apps/app
pnpm run start
```

## 🔒 Environment Variables

Each application has its own environment configuration:

- `apps/api/.env.example` - API environment variables
- See [API Configuration](./docs/api/configuration.md) for details

## 📄 License

This project is private and unlicensed.

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and tests
4. Submit a pull request

---

For more detailed information about each application, refer to the README files in their respective directories.
