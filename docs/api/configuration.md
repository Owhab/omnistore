# Configuration

The API uses environment variables for configuration, validated at startup using `class-validator`.

## Environment Variables

Create a `.env` file in the `apps/api` directory based on `.env.example`.

### Application Settings

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | Yes | `development` | Environment mode (`development` or `production`) |
| `API_PORT` | number | Yes | `4000` | Port the API server listens on |
| `APP_URL` | string | Yes | - | Frontend application URL (used for CORS in production) |

### Database Configuration

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `DB_HOST` | string | Yes | PostgreSQL host address |
| `DB_PORT` | number | Yes | PostgreSQL port (typically `5432`) |
| `DB_DATABASE` | string | Yes | Database name |
| `DB_USERNAME` | string | Yes | Database username |
| `DB_PASSWORD` | string | Yes | Database password |

### Authentication

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `JWT_SECRET` | string | Yes | Secret key for signing JWT tokens (min 8 characters) |
| `ENCRYPTION_SECRET` | string | Yes | Secret key for token encryption (min 8 characters) |

### Redis Configuration

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `REDIS_HOST` | string | Yes | Redis server host |
| `REDIS_PORT` | number | Yes | Redis server port (typically `6379`) |
| `REDIS_USER` | string | Yes | Redis username (use `default` for no auth) |
| `REDIS_PASSWORD` | string | Yes | Redis password |

### Email Configuration

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `SMTP_URL` | string | Yes | SMTP connection URL |

### External Services

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `GOOGLE_RECAPTCHA_SECRET_KEY` | string | Yes | Google reCAPTCHA secret key |

## Example Configuration

```env
# Environment
NODE_ENV=development
API_PORT=4000
APP_URL=http://localhost:3030

# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=omnistore_dev
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_SECRET=your-encryption-secret-key

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=your_redis_password

# Email
SMTP_URL=smtp://username:password@smtp.example.com

# External Services
GOOGLE_RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

## Configuration Validation

The API validates all environment variables on startup using the `EnvironmentVariables` class in `src/config/config.schema.ts`. If validation fails, the application will display an error message and exit.

### Validation Rules

- `NODE_ENV`: Must be either `development` or `production`
- `API_PORT`: Must be a valid port number (0-65535)
- `DB_PORT`: Must be a valid port number (0-65535)
- `REDIS_PORT`: Must be a valid port number (0-65535)
- All string variables: Must not be empty

### Error Example

If a required variable is missing or invalid, you'll see:

```
 ENVIRONMENT CONFIGURATION ERROR 

  ✖ DB_PASSWORD: DB_PASSWORD should not be empty

💡 Please check your .env file and try again.
```

## Environment-Specific Behavior

### Development Mode (`NODE_ENV=development`)

- Swagger documentation enabled at `/api-doc`
- Database query logging enabled
- CORS allows all origins
- Email sending logs to console instead of sending

### Production Mode (`NODE_ENV=production`)

- Swagger documentation disabled
- Database query logging disabled
- CORS restricted to `APP_URL` only
- Emails sent via configured SMTP server

## Configuration Service

The `EnvService` (`src/shared/services/env.service.ts`) provides typed access to configuration:

```typescript
import { EnvService } from 'src/shared/services/env.service';

@Injectable()
export class MyService {
  constructor(private env: EnvService) {}

  doSomething() {
    const port = this.env.appConfig.port;
    const isDev = this.env.isDevelopment;
    const dbConfig = this.env.dbConfig;
  }
}
```

### Available Properties

| Property | Type | Description |
|----------|------|-------------|
| `nodeEnv` | string | Current environment |
| `isDevelopment` | boolean | True if in development mode |
| `isProduction` | boolean | True if in production mode |
| `appConfig` | object | Application configuration (port) |
| `corsConfig` | object | CORS configuration |
| `dbConfig` | TypeOrmModuleOptions | Database configuration |
| `authConfig` | object | JWT and encryption secrets |
| `redisConfig` | object | Redis connection details |
| `smtp` | object | SMTP configuration |
| `recaptcha` | object | reCAPTCHA configuration |

## Security Best Practices

1. **Never commit `.env` files** - Add `.env` to `.gitignore`
2. **Use strong secrets** - Generate random strings for `JWT_SECRET` and `ENCRYPTION_SECRET`
3. **Rotate secrets** - Periodically change sensitive values
4. **Use environment-specific configs** - Different values for dev/staging/production
5. **Limit CORS origins** - Set specific `APP_URL` in production
