# Services

This document describes the shared services available throughout the API.

## Overview

The `SharedModule` provides global services that can be injected into any module:

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

## EnvService

Provides typed access to environment variables.

### Usage

```typescript
import { EnvService } from 'src/shared/services/env.service';

@Injectable()
export class MyService {
  constructor(private env: EnvService) {}

  doSomething() {
    if (this.env.isDevelopment) {
      console.log('Running in development mode');
    }
  }
}
```

### Available Properties

| Property | Type | Description |
|----------|------|-------------|
| `nodeEnv` | `string` | Current environment (`development` or `production`) |
| `isDevelopment` | `boolean` | True if running in development |
| `isProduction` | `boolean` | True if running in production |
| `appConfig` | `{ port: string }` | Application configuration |
| `corsConfig` | `object` | CORS configuration |
| `dbConfig` | `TypeOrmModuleOptions` | Database configuration |
| `authConfig` | `{ jwtSecret, encryptionSecret }` | Authentication secrets |
| `redisConfig` | `{ host, port, password, url }` | Redis configuration |
| `smtp` | `{ url }` | SMTP configuration |
| `recaptcha` | `{ secretKey }` | reCAPTCHA secret key |

## TokenService

Handles JWT token operations with encryption.

### Usage

```typescript
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(private token: TokenService) {}

  async login(user: User) {
    const token = await this.token.signToken({ id: user.id });
    return { token };
  }
}
```

### Methods

#### `signToken(user: Partial<User>): Promise<string>`

Creates and encrypts a JWT token.

```typescript
const token = await tokenService.signToken({ id: 1 });
// Returns encrypted token string
```

#### `decodeToken(token: string): { isValid, decoded?, error? }`

Decrypts and verifies a JWT token.

```typescript
const result = tokenService.decodeToken(token);
if (result.isValid) {
  console.log(result.decoded.id); // User ID
} else {
  console.log(result.error); // Error message
}
```

#### `extract(request: Request): string | null`

Extracts and decrypts token from request Authorization header.

```typescript
const token = tokenService.extract(request);
// Returns decrypted JWT or null
```

## EncryptionService

Provides encryption/decryption using Cryptr.

### Usage

```typescript
import { EncryptionService } from 'src/shared/services/encryption.service';

@Injectable()
export class MyService {
  constructor(private encryption: EncryptionService) {}

  storeSecretData(data: string) {
    const encrypted = this.encryption.encrypt(data);
    // Store encrypted value
  }
}
```

### Methods

#### `encrypt(value: string): string | null`

Encrypts a string value.

```typescript
const encrypted = encryptionService.encrypt('sensitive data');
// Returns encrypted string or null on error
```

#### `decrypt(encryptedValue: string): string | null`

Decrypts an encrypted value.

```typescript
const decrypted = encryptionService.decrypt(encrypted);
// Returns original string or null on error
```

## RedisService

Provides Redis operations for caching and data storage.

### Usage

```typescript
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private redis: RedisService) {}

  async cacheUser(user: User) {
    await this.redis.setWithExpiry('user', user.id.toString(), JSON.stringify(user), 3600);
  }
}
```

### Methods

#### `get(prefix: string, key: string): Promise<string | null>`

Gets a value from Redis.

```typescript
const value = await redisService.get('user', '123');
// Returns value or null
```

#### `set(prefix: string, key: string, value: string): Promise<void>`

Sets a value in Redis (no expiry).

```typescript
await redisService.set('config', 'setting', 'value');
```

#### `setWithExpiry(prefix: string, key: string, value: string, expiry: number): Promise<void>`

Sets a value with expiration (in seconds).

```typescript
await redisService.setWithExpiry('session', 'abc123', 'data', 3600);
// Expires in 1 hour
```

#### `delete(prefix: string, key: string): Promise<void>`

Deletes a value from Redis.

```typescript
await redisService.delete('session', 'abc123');
```

## GeneratorService

Utility service for generating random values.

### Usage

```typescript
import { GeneratorService } from 'src/shared/services/generator.service';

@Injectable()
export class MyService {
  constructor(private generator: GeneratorService) {}

  createVerificationCode() {
    return this.generator.generateCode(6);
  }
}
```

## UtilService

General utility functions.

### Usage

```typescript
import { UtilService } from 'src/shared/services/util.service';

@Injectable()
export class MyService {
  constructor(private util: UtilService) {}
}
```

## Background Jobs (Queue Service)

The API uses BullMQ for background job processing.

### Available Queues

| Queue Name | Purpose |
|------------|---------|
| `background-jobs` | General background tasks |
| `in-app-email` | Email sending |

### Adding Jobs to Queue

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Queues, InAppEmail } from 'src/constants/queue.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue(Queues.IN_APP_EMAIL) private emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(user: User) {
    await this.emailQueue.add(InAppEmail.GET_IN_TOUCH, {
      to: user.email,
      name: user.name,
    });
  }
}
```

### Creating Consumers

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Queues } from 'src/constants/queue.enum';

@Processor(Queues.IN_APP_EMAIL)
export class EmailConsumer extends WorkerHost {
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'welcome':
        await this.sendWelcomeEmail(job.data);
        break;
    }
  }
}
```

### Job Options

Default job options:

```typescript
defaultJobOptions: {
  attempts: 2,      // Retry failed jobs twice
  backoff: 2,       // Backoff delay between retries
}
```

## Email Service

The API uses `@nestjs-modules/mailer` with Handlebars templates.

### Sending Emails

```typescript
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService {
  constructor(private mailer: MailerService) {}

  async sendEmail(to: string, subject: string, template: string, context: object) {
    await this.mailer.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
```

### Email Templates

Templates are located in `src/templates/` using Handlebars (`.hbs`) format:

```handlebars
<!-- src/templates/welcome.hbs -->
<h1>Welcome, {{name}}!</h1>
<p>Thank you for joining us.</p>
```

### Development Mode

In development mode, emails are logged to console instead of being sent:

```
App not running in production, dumping the content:
--- start
{ to: 'user@example.com', subject: 'Welcome!' }
Welcome, John!
Thank you for joining us.
--- end
```
