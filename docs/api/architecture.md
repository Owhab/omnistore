# Architecture

This document describes the architecture and design patterns used in the API.

## Overview

The API follows NestJS best practices with a modular architecture, separating concerns into distinct layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Request                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Middleware                                │
│              (Helmet, Compression, CORS, reCAPTCHA)             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Guards                                  │
│              (AuthGuard, RolesGuard, ThrottlerGuard)            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Pipes                                   │
│                   (ValidateIncomingInput)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Controllers                                │
│              (AuthController, ProfileController)                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Services                                  │
│               (AuthService, ProfileService)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Repositories                                │
│                    (UserRepository)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Interceptors                                 │
│                  (ResponseInterceptor)                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Response                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Module Structure

### AppModule

The root module that bootstraps the application:

```typescript
@Module({
  imports: [
    RouterModule.register(routes),      // Route configuration
    ConfigModule.forRoot(),             // Environment config
    ThrottlerModule.forRoot(),          // Rate limiting
    TypeOrmModule.forRootAsync(),       // Database
    MailerModule.forRootAsync(),        // Email service
    QueueModule.register(),             // Background jobs
    SharedModule,                       // Shared services
    AuthModule,                         // Authentication
    UserModule,                         // User management
    ProfileModule,                      // User profiles
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_PIPE, useClass: ValidateIncomingInput },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
```

### Feature Modules

Each feature is encapsulated in its own module:

```
modules/
├── auth/           # Authentication (login, register)
├── profile/        # User profile management
├── queue/          # Background job processing
└── user/           # User entity and repository
```

### SharedModule

Global module providing common services:

```typescript
@Global()
@Module({
  imports: [RedisModule],
  providers: [
    JwtService,
    TokenService,
    EnvService,
    GeneratorService,
    EncryptionService,
    UtilService,
    IsUniqueConstraint,
  ],
  exports: [...providers],
})
export class SharedModule {}
```

## Design Patterns

### Repository Pattern

The API uses a custom `BaseRepository` that wraps TypeORM's repository:

```typescript
export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repo: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T>;
  async findMany<Options>(findManyArgs: Options): Promise<T[]>;
  async findOne<Options>(findOneArgs: Options): Promise<T | null>;
  async findOneOrThrow<Options>(findOneArgs: Options, message?: string): Promise<T>;
  async update(criteria: any, data: any): Promise<UpdateResult>;
  async delete(criteria: any): Promise<DeleteResult>;
}
```

Usage:

```typescript
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }
}
```

### Abstract Entity

All entities extend `AbstractEntity` for common fields:

```typescript
export abstract class AbstractEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  toJSON() {
    return instanceToPlain(this);
  }
}
```

## Guards

### AuthGuard

Handles JWT token extraction and validation:

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for @Public() or @Unauth() decorators
    // Extract and validate JWT token
    // Load user from database
    // Attach user to request
  }
}
```

### RolesGuard

Enforces role-based access control:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Check for @Roles() decorator
    // Verify user has required role
  }
}
```

### ThrottlerIpGuard

Rate limiting based on IP address:

```typescript
@Injectable()
export class ThrottlerIpGuard extends ThrottlerGuard {
  // Custom implementation for IP-based throttling
}
```

## Decorators

### Custom Decorators

| Decorator | Purpose | Usage |
|-----------|---------|-------|
| `@Public()` | Skip authentication | Public endpoints |
| `@Unauth()` | Only unauthenticated users | Login/register |
| `@Roles(...roles)` | Require specific roles | Admin-only endpoints |
| `@AuthUser()` | Get current user | Access user in controller |
| `@AccessToken()` | Get JWT token | Access token in controller |
| `@ResponseMessage(msg)` | Set response message | Custom success messages |

### Example Usage

```typescript
@Controller('admin')
@Roles(RolesEnum.ADMIN)
export class AdminController {
  @Get('dashboard')
  @ResponseMessage('Dashboard loaded')
  getDashboard(@AuthUser() user: User) {
    return this.adminService.getDashboard(user.id);
  }
}
```

## Exception Handling

### Custom Exceptions

The API provides custom exception classes:

```
exceptions/
├── app.exception.ts          # Base exception
├── bad-request.exception.ts  # 400 errors
├── unauthenticated.exception.ts  # 401 errors
├── unauthorized.exception.ts     # 403 errors
├── not-found.exception.ts        # 404 errors
├── not-acceptable.exception.ts   # 406 errors
├── unprocessable.exception.ts    # 422 errors
└── throttler.exception.ts        # 429 errors
```

### Exception Filters

Two filters handle exceptions:

1. **AppExceptionFilter** - Handles custom `AppException` instances
2. **GlobalExceptionFilter** - Catches all unhandled exceptions

### Response Format

All responses follow a consistent format:

```json
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description",
  "code": "ErrorCode"
}
```

## Request Pipeline

1. **Middleware** - Security headers, compression, CORS
2. **Guards** - Authentication and authorization
3. **Pipes** - Input validation and transformation
4. **Controllers** - Route handling
5. **Services** - Business logic
6. **Repositories** - Data access
7. **Interceptors** - Response formatting
8. **Filters** - Exception handling

## Background Jobs

The API uses BullMQ for background job processing:

```typescript
@Module({})
export class QueueModule {
  static register(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          useFactory: (env: EnvService) => ({
            connection: { url: env.redisConfig.url },
          }),
        }),
        BullModule.registerQueue(
          { name: Queues.BACKGROUND_JOBS },
          { name: Queues.IN_APP_EMAIL },
        ),
      ],
    };
  }
}
```

### Available Queues

| Queue | Purpose |
|-------|---------|
| `background-jobs` | General background tasks |
| `in-app-email` | Email sending |

## API Versioning

The API uses URI versioning:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
});
```

Routes are prefixed with version: `/v1/auth/login`, `/v1/profile`, etc.
