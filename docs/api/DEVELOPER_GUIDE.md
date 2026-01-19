# NestJS API Developer Guide

A comprehensive guide to using the boilerplate code in this NestJS API for future development.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Creating New Modules](#creating-new-modules)
3. [Entities & Repositories](#entities--repositories)
4. [DTOs & Validation](#dtos--validation)
5. [Custom Decorators](#custom-decorators)
6. [Guards & Authentication](#guards--authentication)
7. [Exception Handling](#exception-handling)
8. [Background Jobs & Queues](#background-jobs--queues)
9. [Email Service](#email-service)
10. [Redis Caching](#redis-caching)
11. [Middleware](#middleware)
12. [Shared Services](#shared-services)

---

## Project Structure

```
apps/api/src/
├── common/                 # Base classes (AbstractEntity, BaseRepository)
├── config/                 # Configuration & validation schemas
├── constants/              # Enums and constants
├── decorators/             # Custom decorators
├── exceptions/             # Custom exception classes
├── filters/                # Exception filters
├── guards/                 # Authentication & authorization guards
├── interceptors/           # Response interceptors
├── middleware/             # Custom middleware (reCAPTCHA, etc.)
├── modules/                # Feature modules
├── pipes/                  # Validation pipes
├── redis/                  # Redis service
├── shared/                 # Shared/global services
├── templates/              # Email templates (Handlebars)
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions & validators
```

---

## Creating New Modules

### Step 1: Create Module Structure

```bash
# Create a new module folder
mkdir -p src/modules/product
```

### Step 2: Create the Entity

```typescript
// src/modules/product/product.entity.ts
import { Column, Entity } from 'typeorm';
import { AbstractEntity } from 'src/common/abstract.entity';

@Entity({ name: 'products' })
export class Product extends AbstractEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
```

### Step 3: Create the Repository

```typescript
// src/modules/product/product.repo.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/common/base.repo';
import { Product } from './product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(@InjectRepository(Product) repo: Repository<Product>) {
    super(repo);
  }

  // Add custom repository methods here
  async findActiveProducts() {
    return this.findMany({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPriceRange(min: number, max: number) {
    return this.repo
      .createQueryBuilder('product')
      .where('product.price BETWEEN :min AND :max', { min, max })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
```

### Step 4: Create DTOs

```typescript
// src/modules/product/dtos/create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from 'src/utils/transformers/trim.decorator';
import { ValidationMessages } from 'src/utils/validators/validation-message';

export class CreateProductDto {
  @MaxLength(100, { message: ValidationMessages.maxLength('Name', 100) })
  @IsNotEmpty({ message: 'Product name is required' })
  @Trim()
  @ApiProperty({ example: 'iPhone 15 Pro' })
  name: string;

  @IsOptional()
  @Trim()
  @ApiProperty({ example: 'Latest Apple smartphone', required: false })
  description?: string;

  @IsPositive({ message: 'Price must be a positive number' })
  @IsNumber({}, { message: 'Price must be a number' })
  @ApiProperty({ example: 999.99 })
  price: number;

  @Min(0, { message: 'Stock cannot be negative' })
  @IsNumber({}, { message: 'Stock must be a number' })
  @IsOptional()
  @ApiProperty({ example: 100, required: false })
  stock?: number;
}
```

```typescript
// src/modules/product/dtos/update-product.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### Step 5: Create the Service

```typescript
// src/modules/product/product.service.ts
import { Injectable } from '@nestjs/common';
import NotFoundException from 'src/exceptions/not-found.exception';
import { ProductRepository } from './product.repo';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private productRepo: ProductRepository) {}

  async create(dto: CreateProductDto) {
    return this.productRepo.create(dto);
  }

  async findAll() {
    return this.productRepo.findActiveProducts();
  }

  async findOne(id: number) {
    return this.productRepo.findOneOrThrow(
      { where: { id } },
      'Product not found',
    );
  }

  async update(id: number, dto: UpdateProductDto) {
    const { data } = await this.productRepo.findOneAndUpdate(
      { where: { id } },
      dto,
      'Product not found',
    );
    return data;
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.productRepo.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
```

### Step 6: Create the Controller

```typescript
// src/modules/product/product.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Public } from 'src/decorators/skip-auth.decorator';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { RolesEnum } from 'src/constants/role.enum';
import { User } from 'src/modules/user/user.entity';
import { ProductService } from './product.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

@ApiTags('products')
@Controller({ version: '1' })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(RolesEnum.ADMIN)
  @ResponseMessage('Product created successfully')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Product created' })
  create(@Body() dto: CreateProductDto, @AuthUser() user: User) {
    return this.productService.create(dto);
  }

  @Get()
  @Public()
  @ResponseMessage('Products retrieved successfully')
  @ApiOkResponse({ description: 'List of products' })
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Product retrieved successfully')
  @ApiOkResponse({ description: 'Product details' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Roles(RolesEnum.ADMIN)
  @ResponseMessage('Product updated successfully')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Product updated' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  @ResponseMessage('Product deleted successfully')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Product deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
```

### Step 7: Create the Module

```typescript
// src/modules/product/product.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductRepository } from './product.repo';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductRepository, ProductService],
  exports: [ProductRepository],
})
export class ProductModule {}
```

### Step 8: Register the Module & Route

```typescript
// src/app.module.ts - Add to imports array
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    // ... other imports
    ProductModule,
  ],
})
export class AppModule {}
```

```typescript
// src/routes.ts - Add route
import { ProductModule } from './modules/product/product.module';

const routes: Routes = [
  // ... other routes
  {
    path: 'products',
    module: ProductModule,
  },
];
```

---

## Entities & Repositories

### AbstractEntity Base Class

All entities should extend `AbstractEntity` to get common fields:

```typescript
import { AbstractEntity } from 'src/common/abstract.entity';

@Entity({ name: 'your_table' })
export class YourEntity extends AbstractEntity {
  // AbstractEntity provides:
  // - id: number (auto-generated primary key)
  // - createdAt: Date
  // - updatedAt: Date
  // - toJSON(): method for serialization
}
```

### BaseRepository Methods

The `BaseRepository` provides these methods:

```typescript
// Create a new record
const entity = await repo.create({ name: 'Test' });

// Find multiple records
const items = await repo.findMany({
  where: { isActive: true },
  select: { id: true, name: true },
  order: { createdAt: 'DESC' },
  take: 10,
  skip: 0,
});

// Find one record (returns null if not found)
const item = await repo.findOne({
  where: { id: 1 },
  relations: ['category'],
});

// Find one or throw exception
const item = await repo.findOneOrThrow(
  { where: { id: 1 } },
  'Item not found', // Custom error message
);

// Update records
const result = await repo.update({ id: 1 }, { name: 'Updated' });

// Find and update (throws if not found)
const { data, updateResult } = await repo.findOneAndUpdate(
  { where: { id: 1 } },
  { name: 'Updated' },
  'Item not found',
);

// Delete records
const result = await repo.delete(1);
// or
const result = await repo.delete({ isActive: false });

// Count records
const count = await repo.count({ where: { isActive: true } });

// Raw query
const results = await repo.query(
  'SELECT * FROM users WHERE email = $1',
  ['test@example.com'],
);
```

### Entity Hooks Example

```typescript
@Entity({ name: 'users' })
export class User extends AbstractEntity {
  @Column()
  password: string;

  // Store original password for comparison
  @Exclude()
  private tempPassword?: string;

  @AfterLoad()
  private loadTempPassword(): void {
    this.tempPassword = this.password;
  }

  // Hash password before save if changed
  @BeforeInsert()
  @BeforeUpdate()
  private async hashPassword() {
    if (this.tempPassword !== this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Instance method
  async comparePassword(password: string) {
    return bcrypt.compare(password, this.password);
  }
}
```

---

## DTOs & Validation

### Available Validators

```typescript
import {
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsBoolean,
  IsArray,
  IsDate,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
```

### Custom Validators

#### @Trim() - Trim whitespace

```typescript
import { Trim } from 'src/utils/transformers/trim.decorator';

export class CreateUserDto {
  @Trim()
  @IsNotEmpty()
  name: string; // "  John  " becomes "John"
}
```

#### @IsUnique() - Database uniqueness check

```typescript
import { IsUnique } from 'src/utils/validators/is-unique.validator';
import { User } from 'src/modules/user/user.entity';

export class RegisterDto {
  // Simple field check
  @IsUnique(User, 'email', { message: 'Email already exists' })
  email: string;

  // Custom query function
  @IsUnique(User, async (repo, value, args) => {
    return repo.findOne({
      where: { username: value, deletedAt: null },
    });
  }, { message: 'Username is taken' })
  username: string;
}
```

#### @MatchField() - Match another field

```typescript
import { MatchField } from 'src/utils/validators/match-field.validator';

export class ResetPasswordDto {
  @MinLength(8)
  password: string;

  @MatchField('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
```

#### ValidationMessages Helper

```typescript
import { ValidationMessages } from 'src/utils/validators/validation-message';

export class CreateDto {
  @MaxLength(100, { message: ValidationMessages.maxLength('Name', 100) })
  // Output: "Name must be maximum 100 characters long"
  name: string;

  @MinLength(8, { message: ValidationMessages.minLength('Password', 8) })
  // Output: "Password must be minimum 8 characters long"
  password: string;
}
```

### Complete DTO Example

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from 'src/utils/transformers/trim.decorator';
import { IsUnique } from 'src/utils/validators/is-unique.validator';
import { MatchField } from 'src/utils/validators/match-field.validator';
import { ValidationMessages } from 'src/utils/validators/validation-message';
import { User } from 'src/modules/user/user.entity';
import { RolesEnum } from 'src/constants/role.enum';

export class CreateUserDto {
  @MaxLength(50, { message: ValidationMessages.maxLength('Name', 50) })
  @IsNotEmpty({ message: 'Name is required' })
  @Trim()
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @IsUnique(User, 'email', { message: 'Email already registered' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Trim()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @MaxLength(64, { message: ValidationMessages.maxLength('Password', 64) })
  @MinLength(8, { message: ValidationMessages.minLength('Password', 8) })
  @IsNotEmpty({ message: 'Password is required' })
  @ApiProperty({ example: 'securePassword123' })
  password: string;

  @MatchField('password', { message: 'Passwords do not match' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @ApiProperty({ example: 'securePassword123' })
  confirmPassword: string;

  @IsEnum(RolesEnum, { message: 'Invalid role' })
  @ValidateIf((o) => o.role !== RolesEnum.ADMIN)
  @IsOptional()
  @ApiPropertyOptional({ enum: RolesEnum, default: RolesEnum.USER })
  role?: RolesEnum;
}
```

---

## Custom Decorators

### @Public() - Skip Authentication

Makes an endpoint accessible without authentication:

```typescript
import { Public } from 'src/decorators/skip-auth.decorator';

@Controller('products')
export class ProductController {
  @Get()
  @Public() // Anyone can access this endpoint
  findAll() {
    return this.productService.findAll();
  }
}
```

### @Unauth() / @UseUnauthGuard() - Unauthenticated Only

Only allows unauthenticated users (blocks logged-in users):

```typescript
import { UseUnauthGuard } from 'src/decorators/use-unauth.decorator';

@Controller('auth')
export class AuthController {
  @Post('login')
  @UseUnauthGuard() // Only non-logged-in users can access
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @UseUnauthGuard()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
```

### @Roles() - Role-Based Access Control

Restricts endpoint access to specific roles:

```typescript
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/constants/role.enum';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @Roles(RolesEnum.ADMIN) // Only admins can access
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('reports')
  @Roles(RolesEnum.ADMIN, RolesEnum.USER) // Multiple roles allowed
  getReports() {
    return this.adminService.getReports();
  }
}

// Apply to entire controller
@Controller('admin')
@Roles(RolesEnum.ADMIN) // All endpoints require admin role
export class AdminController {
  // ...
}
```

### @AuthUser() - Get Authenticated User

Retrieves the current authenticated user in controller methods:

```typescript
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/modules/user/user.entity';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@AuthUser() user: User) {
    // user contains: id, name, email, role, isVerified
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @AuthUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.id, dto);
  }
}
```

### @AccessToken() - Get JWT Token

Retrieves the decrypted JWT token from the request:

```typescript
import { AccessToken } from 'src/decorators/access-token.decorator';

@Controller('auth')
export class AuthController {
  @Get('verify')
  @Public()
  verifyToken(@AccessToken() token: string) {
    // token is the decrypted JWT string
    return this.authService.verifyToken(token);
  }
}
```

### @ResponseMessage() - Custom Success Message

Sets a custom success message in the response:

```typescript
import { ResponseMessage } from 'src/decorators/response-message.decorator';

@Controller('products')
export class ProductController {
  @Post()
  @ResponseMessage('Product created successfully')
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
  // Response: { success: true, message: 'Product created successfully', data: {...} }

  @Delete(':id')
  @ResponseMessage('Product has been removed')
  remove(@Param('id') id: number) {
    return this.productService.remove(id);
  }
}
```

### @InjectBackgroundQueue() / @InjectInAppEmail() - Queue Injection

Inject job queues into services:

```typescript
import { InjectBackgroundQueue, InjectInAppEmail } from 'src/decorators/inject-queue.decorator';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationService {
  constructor(
    @InjectBackgroundQueue() private backgroundQueue: Queue,
    @InjectInAppEmail() private emailQueue: Queue,
  ) {}

  async scheduleTask(data: any) {
    await this.backgroundQueue.add('process-task', data);
  }

  async sendEmail(data: any) {
    await this.emailQueue.add('send-welcome', data);
  }
}
```

---

## Guards & Authentication

### How Authentication Works

1. **AuthGuard** runs on every request (global)
2. Checks for `@Public()` or `@Unauth()` decorators
3. Extracts and decrypts JWT from `Authorization: Bearer <token>`
4. Verifies token and loads user from database
5. Attaches user to `request.user`

### Guard Execution Order

```
Request → AuthGuard → RolesGuard → ThrottlerIpGuard → Controller
```

### Creating Custom Guards

```typescript
// src/guards/subscription.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import ForbiddenException from 'src/exceptions/forbidden.exception';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check subscription status
    if (!user.hasActiveSubscription) {
      throw new ForbiddenException('Active subscription required');
    }

    return true;
  }
}

// Usage in controller
@Controller('premium')
@UseGuards(SubscriptionGuard)
export class PremiumController {
  @Get('content')
  getPremiumContent() {
    return this.premiumService.getContent();
  }
}
```

### Using ThrottlerIpGuard (Rate Limiting)

```typescript
import { UseGuards } from '@nestjs/common';
import { ThrottlerIpGuard } from 'src/guards/throttler-ip.guard';

@Controller('auth')
@UseGuards(ThrottlerIpGuard) // Apply rate limiting
export class AuthController {
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

Rate limit configuration in `app.module.ts`:
```typescript
ThrottlerModule.forRoot({
  throttlers: [
    {
      ttl: 10000,        // Time window: 10 seconds
      limit: 5,          // Max 5 requests per window
      blockDuration: 3600000, // Block for 1 hour if exceeded
    },
  ],
}),
```

---

## Exception Handling

### Available Exception Classes

| Exception | HTTP Status | Code | Usage |
|-----------|-------------|------|-------|
| `BadRequestException` | 400 | `BadRequest` | Invalid request data |
| `UnauthenticatedException` | 401 | `Unauthenticated` | Not logged in |
| `UnauthorizedException` | 403 | `Unauthorized` | No permission |
| `ForbiddenException` | 403 | `Forbidden` | Access denied |
| `NotFoundException` | 404 | `NotFound` | Resource not found |
| `NotAcceptableException` | 406 | `NotAcceptable` | Request not acceptable |
| `UnprocessableException` | 422 | `ValidationError` | Validation failed |
| `ThrottlerException` | 429 | `ThrottlerException` | Rate limit exceeded |

### Using Exceptions

```typescript
import BadRequestException from 'src/exceptions/bad-request.exception';
import NotFoundException from 'src/exceptions/not-found.exception';
import UnauthenticatedException from 'src/exceptions/unauthenticated.exception';
import UnauthorizedException from 'src/exceptions/unauthorized.exception';
import ForbiddenException from 'src/exceptions/forbidden.exception';
import UnprocessableException from 'src/exceptions/unprocessable.exception';

@Injectable()
export class ProductService {
  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    
    if (!product) {
      // Simple string message
      throw new NotFoundException('Product not found');
    }
    
    return product;
  }

  async create(dto: CreateProductDto, userId: number) {
    // Object message (field-specific errors)
    if (dto.price < 0) {
      throw new BadRequestException({
        price: 'Price cannot be negative',
      });
    }

    // Multiple field errors
    const errors: Record<string, string> = {};
    if (!dto.name) errors.name = 'Name is required';
    if (!dto.price) errors.price = 'Price is required';
    
    if (Object.keys(errors).length > 0) {
      throw new UnprocessableException(errors);
    }

    return this.productRepo.create({ ...dto, userId });
  }

  async delete(id: number, user: User) {
    const product = await this.findOne(id);
    
    if (product.userId !== user.id && user.role !== RolesEnum.ADMIN) {
      throw new ForbiddenException({
        message: 'You can only delete your own products',
      });
    }

    return this.productRepo.delete(id);
  }
}
```

### Response Format

All exceptions return a consistent format:

```json
{
  "success": false,
  "message": "Error description" | { "field": "Field error" },
  "code": "ErrorCode"
}
```

### Creating Custom Exceptions

```typescript
// src/exceptions/payment-failed.exception.ts
import { HttpStatus } from '@nestjs/common';
import AppException from './app.exception';

export default class PaymentFailedException<
  K extends string,
  V,
> extends AppException<K, V> {
  constructor(message: string | Record<K, V>) {
    super(message, {
      code: 'PaymentFailed',
      status: HttpStatus.PAYMENT_REQUIRED, // 402
    });
  }
}

// Usage
throw new PaymentFailedException('Payment processing failed');
```

---

## Background Jobs & Queues

### Available Queues

```typescript
// src/constants/queue.enum.ts
export enum Queues {
  BACKGROUND_JOBS = 'background-jobs',
  IN_APP_EMAIL = 'in-app-email',
}

export enum InAppEmail {
  GET_IN_TOUCH = 'get-in-touch',
  GET_SOFTWARE = 'get-software',
}
```

### Adding Jobs to Queue

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectBackgroundQueue, InjectInAppEmail } from 'src/decorators/inject-queue.decorator';
import { InAppEmail } from 'src/constants/queue.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectBackgroundQueue() private backgroundQueue: Queue,
    @InjectInAppEmail() private emailQueue: Queue,
  ) {}

  // Add a simple job
  async processInBackground(data: any) {
    await this.backgroundQueue.add('task-name', data);
  }

  // Add job with options
  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.emailQueue.add(
      InAppEmail.GET_IN_TOUCH,
      {
        to: user.email,
        name: user.name,
        template: 'welcome',
      },
      {
        delay: 5000,         // Delay 5 seconds
        attempts: 3,         // Retry 3 times on failure
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  // Add scheduled/recurring job
  async scheduleReport() {
    await this.backgroundQueue.add(
      'generate-report',
      { type: 'daily' },
      {
        repeat: {
          pattern: '0 9 * * *', // Every day at 9 AM (cron)
        },
      },
    );
  }
}
```

### Creating Job Consumers

```typescript
// src/modules/queue/consumers/background.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Queues } from 'src/constants/queue.enum';

@Processor(Queues.BACKGROUND_JOBS)
export class BackgroundConsumer extends WorkerHost {
  async process(job: Job): Promise<any> {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    
    switch (job.name) {
      case 'task-name':
        return this.handleTask(job.data);
      
      case 'generate-report':
        return this.generateReport(job.data);
      
      default:
        console.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleTask(data: any) {
    // Process the task
    console.log('Handling task:', data);
    return { processed: true };
  }

  private async generateReport(data: { type: string }) {
    console.log('Generating report:', data.type);
    // Generate report logic
  }

  // Event handlers
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} failed:`, error.message);
  }
}
```

### Register Consumer in Module

```typescript
// src/modules/queue/queue.module.ts
import { BackgroundConsumer } from './consumers/background.consumer';

const consumers = [InAppEmailConsumer, BackgroundConsumer];

@Module({
  imports: [UserModule],
  providers: [...consumers],
})
export class QueueModule {
  // ...
}
```

### Adding a New Queue

1. Add to enum:
```typescript
// src/constants/queue.enum.ts
export enum Queues {
  BACKGROUND_JOBS = 'background-jobs',
  IN_APP_EMAIL = 'in-app-email',
  NOTIFICATIONS = 'notifications', // New queue
}
```

2. Create decorator (optional):
```typescript
// src/decorators/inject-queue.decorator.ts
export const InjectNotifications = (): ParameterDecorator =>
  InjectQueue(Queues.NOTIFICATIONS);
```

3. Create consumer:
```typescript
@Processor(Queues.NOTIFICATIONS)
export class NotificationsConsumer extends WorkerHost {
  async process(job: Job): Promise<any> {
    // Handle notification jobs
  }
}
```

---

## Email Service

### Configuration

Email is configured via SMTP URL in `.env`:
```env
SMTP_URL=smtp://username:password@smtp.mailtrap.io
```

### Sending Emails

```typescript
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome', // Uses src/templates/welcome.hbs
      context: {
        name: user.name,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendPasswordReset(email: string, resetLink: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        resetLink,
        expiresIn: '1 hour',
      },
    });
  }
}
```

### Creating Email Templates

Create Handlebars templates in `src/templates/`:

```handlebars
<!-- src/templates/welcome.hbs -->
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
    .body { padding: 20px; }
    .button { 
      background: #007bff; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px;
      display: inline-block;
    }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome!</h1>
    </div>
    <div class="body">
      <h2>Hi {{name}},</h2>
      <p>Thank you for joining our platform. We're excited to have you!</p>
      <p>
        <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
      </p>
    </div>
    <div class="footer">
      © {{year}} Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>
```

### Sending Emails via Queue (Recommended)

For better performance, send emails through the queue:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectInAppEmail } from 'src/decorators/inject-queue.decorator';
import { InAppEmail } from 'src/constants/queue.enum';

@Injectable()
export class NotificationService {
  constructor(@InjectInAppEmail() private emailQueue: Queue) {}

  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.emailQueue.add(InAppEmail.GET_IN_TOUCH, {
      to: user.email,
      subject: 'Welcome!',
      template: 'welcome',
      context: {
        name: user.name,
        year: new Date().getFullYear(),
      },
    });
  }
}
```

### Email Consumer Implementation

```typescript
// src/modules/queue/consumers/in-app-email.consumer.ts
import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Queues } from 'src/constants/queue.enum';
import { EnvService } from 'src/shared/services/env.service';

export type SendEmail = {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
};

@Processor(Queues.IN_APP_EMAIL)
export class InAppEmailConsumer extends WorkerHost {
  constructor(
    private readonly mailService: MailerService,
    private readonly env: EnvService,
  ) {
    super();
  }

  async process(job: Job<SendEmail>): Promise<void> {
    const { to, subject, template, context } = job.data;

    // In development, log instead of sending
    if (this.env.isDevelopment) {
      console.log('📧 Email would be sent:', { to, subject, template, context });
      return;
    }

    await this.mailService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
```

---

## Redis Caching

### RedisService Methods

```typescript
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private redis: RedisService) {}

  // Get a value
  async getCache(key: string) {
    const value = await this.redis.get('cache', key);
    return value ? JSON.parse(value) : null;
  }

  // Set a value (permanent)
  async setCache(key: string, data: any) {
    await this.redis.set('cache', key, JSON.stringify(data));
  }

  // Set with expiration (seconds)
  async setCacheWithTTL(key: string, data: any, ttlSeconds: number) {
    await this.redis.setWithExpiry('cache', key, JSON.stringify(data), ttlSeconds);
  }

  // Delete a value
  async deleteCache(key: string) {
    await this.redis.delete('cache', key);
  }
}
```

### Practical Caching Examples

```typescript
@Injectable()
export class ProductService {
  constructor(
    private productRepo: ProductRepository,
    private redis: RedisService,
  ) {}

  async findOne(id: number) {
    const cacheKey = `product:${id}`;
    
    // Try cache first
    const cached = await this.redis.get('products', cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const product = await this.productRepo.findOneOrThrow(
      { where: { id } },
      'Product not found',
    );

    // Cache for 1 hour
    await this.redis.setWithExpiry(
      'products',
      cacheKey,
      JSON.stringify(product),
      3600,
    );

    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.productRepo.findOneAndUpdate(
      { where: { id } },
      dto,
    );

    // Invalidate cache
    await this.redis.delete('products', `product:${id}`);

    return product.data;
  }
}
```

### Session Storage Example

```typescript
@Injectable()
export class SessionService {
  constructor(private redis: RedisService) {}

  async createSession(userId: number, sessionData: any) {
    const sessionId = crypto.randomUUID();
    
    await this.redis.setWithExpiry(
      'sessions',
      sessionId,
      JSON.stringify({ userId, ...sessionData }),
      86400, // 24 hours
    );

    return sessionId;
  }

  async getSession(sessionId: string) {
    const data = await this.redis.get('sessions', sessionId);
    return data ? JSON.parse(data) : null;
  }

  async destroySession(sessionId: string) {
    await this.redis.delete('sessions', sessionId);
  }
}
```

---

## Middleware

### RecaptchaMiddleware

Validates Google reCAPTCHA tokens on requests:

```typescript
// Apply to specific routes in a module
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RecaptchaMiddleware } from 'src/middleware/recaptcha.middleware';

@Module({
  // ...
})
export class ContactModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RecaptchaMiddleware)
      .forRoutes('contact/submit'); // Apply to specific route
  }
}
```

Client-side must include `recaptchaToken` in request body:
```typescript
// Client request
const response = await fetch('/api/contact/submit', {
  method: 'POST',
  body: JSON.stringify({
    name: 'John',
    email: 'john@example.com',
    message: 'Hello!',
    recaptchaToken: 'token-from-google-recaptcha',
  }),
});
```

### Creating Custom Middleware

```typescript
// src/middleware/logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`,
      );
    });

    next();
  }
}

// Apply globally in app.module.ts
@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
```

### Request Validation Middleware

```typescript
// src/middleware/api-key.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import UnauthorizedException from 'src/exceptions/unauthorized.exception';
import { EnvService } from 'src/shared/services/env.service';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private env: EnvService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== this.env.get('API_KEY')) {
      throw new UnauthorizedException('Invalid API key');
    }

    next();
  }
}
```

---

## Shared Services

### EnvService - Environment Variables

Access typed environment variables:

```typescript
import { EnvService } from 'src/shared/services/env.service';

@Injectable()
export class MyService {
  constructor(private env: EnvService) {}

  doSomething() {
    // Check environment
    if (this.env.isDevelopment) {
      console.log('Running in development');
    }

    // Access configurations
    const port = this.env.appConfig.port;
    const dbConfig = this.env.dbConfig;
    const jwtSecret = this.env.authConfig.jwtSecret;
    const redisUrl = this.env.redisConfig.url;
    const smtpUrl = this.env.smtp.url;
  }
}
```

### TokenService - JWT Operations

```typescript
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(private token: TokenService) {}

  async generateToken(user: User) {
    // Sign and encrypt a JWT token
    const token = await this.token.signToken({ id: user.id });
    return token; // Encrypted token string
  }

  verifyToken(token: string) {
    // Decrypt and verify token
    const result = this.token.decodeToken(token);
    
    if (result.isValid) {
      return result.decoded; // { id, iat, exp }
    } else {
      throw new Error(result.error);
    }
  }

  extractFromRequest(request: Request) {
    // Extract token from Authorization header
    const token = this.token.extract(request);
    return token; // Decrypted JWT or null
  }
}
```

### EncryptionService - Encrypt/Decrypt Data

```typescript
import { EncryptionService } from 'src/shared/services/encryption.service';

@Injectable()
export class SecureDataService {
  constructor(private encryption: EncryptionService) {}

  storeSecretData(data: string) {
    const encrypted = this.encryption.encrypt(data);
    // Store encrypted value in database
    return encrypted;
  }

  retrieveSecretData(encrypted: string) {
    const decrypted = this.encryption.decrypt(encrypted);
    return decrypted;
  }
}
```

### GeneratorService - UUID Generation

```typescript
import { GeneratorService } from 'src/shared/services/generator.service';

@Injectable()
export class FileService {
  constructor(private generator: GeneratorService) {}

  generateFileName(extension: string) {
    // Returns: "550e8400-e29b-41d4-a716-446655440000.pdf"
    return this.generator.fileName(extension);
  }

  generateUniqueId() {
    // Returns: "550e8400-e29b-41d4-a716-446655440000"
    return this.generator.uuid();
  }
}
```

### UtilService - Utility Functions

```typescript
import { UtilService } from 'src/shared/services/util.service';

@Injectable()
export class AnalyticsService {
  constructor(private util: UtilService) {}

  trackRequest(req: Request) {
    // Get client IP (handles proxies, Cloudflare, etc.)
    const clientIp = this.util.getIpAddress(req);
    
    // Log or store analytics
    console.log(`Request from: ${clientIp}`);
  }
}
```

---

## Adding New Roles

### Step 1: Update RolesEnum

```typescript
// src/constants/role.enum.ts
export enum RolesEnum {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator', // New role
  VENDOR = 'vendor',       // New role
}
```

### Step 2: Use in Controllers

```typescript
@Controller('moderation')
export class ModerationController {
  @Get('queue')
  @Roles(RolesEnum.MODERATOR, RolesEnum.ADMIN)
  getModerationQueue() {
    return this.moderationService.getQueue();
  }
}

@Controller('vendor')
export class VendorController {
  @Post('products')
  @Roles(RolesEnum.VENDOR)
  createProduct(@Body() dto: CreateProductDto, @AuthUser() vendor: User) {
    return this.vendorService.createProduct(dto, vendor.id);
  }
}
```

---

## Database Migrations

### Generate Migration

```bash
pnpm run migration:generate --name=create-products-table
```

### Migration Example

```typescript
// database/migrations/1234567890-create-products-table.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProductsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
```

### Run Migrations

```bash
pnpm run build
pnpm run migration:run
```

### Revert Migration

```bash
pnpm run migration:revert
```

---

## Quick Reference

### Response Format

All API responses follow this format:

```json
// Success
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description",
  "code": "ErrorCode"
}
```

### Common Decorators Cheat Sheet

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@Public()` | Skip authentication | Public endpoints |
| `@UseUnauthGuard()` | Only unauthenticated users | Login/register |
| `@Roles(RolesEnum.ADMIN)` | Require specific role | Admin-only |
| `@AuthUser()` | Get current user | Controller param |
| `@AccessToken()` | Get JWT token | Controller param |
| `@ResponseMessage('msg')` | Custom response message | Success message |
| `@Trim()` | Trim string whitespace | DTO property |
| `@IsUnique(Entity, 'field')` | Check DB uniqueness | DTO property |
| `@MatchField('field')` | Match another field | Password confirm |

### Import Paths Reference

```typescript
// Decorators
import { Public, Unauth } from 'src/decorators/skip-auth.decorator';
import { UseUnauthGuard } from 'src/decorators/use-unauth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { AccessToken } from 'src/decorators/access-token.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { InjectBackgroundQueue, InjectInAppEmail } from 'src/decorators/inject-queue.decorator';

// Exceptions
import BadRequestException from 'src/exceptions/bad-request.exception';
import NotFoundException from 'src/exceptions/not-found.exception';
import UnauthenticatedException from 'src/exceptions/unauthenticated.exception';
import UnauthorizedException from 'src/exceptions/unauthorized.exception';
import ForbiddenException from 'src/exceptions/forbidden.exception';
import UnprocessableException from 'src/exceptions/unprocessable.exception';

// Services
import { EnvService } from 'src/shared/services/env.service';
import { TokenService } from 'src/shared/services/token.service';
import { EncryptionService } from 'src/shared/services/encryption.service';
import { GeneratorService } from 'src/shared/services/generator.service';
import { UtilService } from 'src/shared/services/util.service';
import { RedisService } from 'src/redis/redis.service';

// Validators & Transformers
import { Trim } from 'src/utils/transformers/trim.decorator';
import { IsUnique } from 'src/utils/validators/is-unique.validator';
import { MatchField } from 'src/utils/validators/match-field.validator';
import { ValidationMessages } from 'src/utils/validators/validation-message';

// Base Classes
import { AbstractEntity } from 'src/common/abstract.entity';
import { BaseRepository } from 'src/common/base.repo';

// Constants
import { RolesEnum } from 'src/constants/role.enum';
import { Queues, InAppEmail } from 'src/constants/queue.enum';

// Guards
import { ThrottlerIpGuard } from 'src/guards/throttler-ip.guard';
```
```
