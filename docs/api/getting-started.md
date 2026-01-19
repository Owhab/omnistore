# Getting Started

This guide will help you set up and run the API locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **pnpm** (v10.25.0 or later) - Package manager
- **PostgreSQL** (v14 or later) - Database
- **Redis** (v6 or later) - Caching and job queues

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd omnistore
```

### 2. Install Dependencies

From the root of the monorepo:

```bash
pnpm install
```

Or navigate to the API directory:

```bash
cd apps/api
pnpm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

Update the `.env` file with your local configuration. See [Configuration](./configuration.md) for detailed information about each variable.

### 4. Database Setup

Ensure PostgreSQL is running, then create your database:

```bash
# Using the setup script
cd apps/api
bash setup-db.sh

# Or manually create the database
createdb your_database_name
```

### 5. Run Migrations

Build the project and run migrations:

```bash
pnpm run build
pnpm run migration:run
```

### 6. (Optional) Seed the Database

```bash
pnpm run seed:run
```

## Running the Application

### Development Mode

```bash
# From root directory
pnpm run dev

# Or from apps/api directory
pnpm run start:dev
```

The API will start with hot-reload enabled at `http://localhost:4000`.

### Production Mode

```bash
pnpm run build
pnpm run start:prod
```

### Debug Mode

```bash
pnpm run start:debug
```

## Accessing the API

Once running, you can access:

| Resource | URL |
|----------|-----|
| API Base URL | `http://localhost:4000` |
| Swagger Documentation | `http://localhost:4000/api-doc` |
| Health Check | `http://localhost:4000/v1/auth/load` |

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start in development mode |
| `pnpm run start:dev` | Start with watch mode |
| `pnpm run start:debug` | Start with debugger |
| `pnpm run start:prod` | Start in production mode |
| `pnpm run build` | Build the application |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format code with Prettier |
| `pnpm run test` | Run unit tests |
| `pnpm run test:e2e` | Run end-to-end tests |
| `pnpm run test:cov` | Run tests with coverage |
| `pnpm run migration:generate` | Generate a new migration |
| `pnpm run migration:run` | Run pending migrations |
| `pnpm run migration:revert` | Revert last migration |
| `pnpm run seed:generate` | Generate a new seeder |
| `pnpm run seed:run` | Run database seeders |

## Testing

### Unit Tests

```bash
pnpm run test
```

### End-to-End Tests

```bash
pnpm run test:e2e
```

### Test Coverage

```bash
pnpm run test:cov
```

## Troubleshooting

### Common Issues

#### Database Connection Failed

Ensure PostgreSQL is running and the credentials in `.env` are correct:

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432
```

#### Redis Connection Failed

Ensure Redis is running:

```bash
# Check Redis status
redis-cli ping
```

#### Port Already in Use

Change the `API_PORT` in your `.env` file or stop the process using port 4000:

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>
```

#### Environment Variable Errors

The API validates environment variables on startup. If you see configuration errors, check that all required variables are set in your `.env` file. See [Configuration](./configuration.md) for the complete list.

## Next Steps

- [Configuration](./configuration.md) - Detailed environment setup
- [Architecture](./architecture.md) - Understanding the codebase
- [Authentication](./authentication.md) - Auth system overview
