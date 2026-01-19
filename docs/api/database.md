# Database

This document covers database setup, migrations, and entity management.

## Overview

The API uses **PostgreSQL** as its database with **TypeORM** as the ORM (Object-Relational Mapper).

## Configuration

Database configuration is managed through environment variables:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=omnistore_dev
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

The configuration is loaded via `EnvService`:

```typescript
get dbConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: this.getString('DB_HOST'),
    port: this.getNumber('DB_PORT'),
    username: this.getString('DB_USERNAME'),
    password: this.getString('DB_PASSWORD'),
    database: this.getString('DB_DATABASE'),
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../../../database/migrations/*{.ts,.js}'],
    poolSize: 5,
    logging: !this.isProduction,
  };
}
```

## Data Source

For CLI operations (migrations, seeding), a separate data source is configured in `database/data-source.ts`:

```typescript
export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/src/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  seeds: ['dist/database/seeds/**/*{.ts,.js}'],
  synchronize: true,  // Note: Set to false in production
};
```

## Entities

### AbstractEntity

All entities extend `AbstractEntity` which provides common fields:

```typescript
export abstract class AbstractEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;

  toJSON() {
    return instanceToPlain(this);
  }
}
```

### User Entity

The main user entity (`src/modules/user/user.entity.ts`):

```typescript
@Entity({ name: 'users' })
export class User extends AbstractEntity {
  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  email: string;

  @Exclude({ toPlainOnly: false })
  @Column({ type: 'varchar', length: 64, nullable: false, select: false })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  role: RolesEnum;

  @Column({ type: 'boolean', default: false, nullable: false })
  isVerified: boolean;
}
```

**Features:**

- Password is excluded from JSON serialization using `@Exclude()`
- Password is not selected by default using `select: false`
- Password is automatically hashed before insert/update using bcrypt

## Migrations

### Generating Migrations

After modifying entities, generate a migration:

```bash
pnpm run migration:generate --name=create-users-table
```

This creates a file in `database/migrations/` with timestamp prefix.

### Running Migrations

Apply pending migrations:

```bash
pnpm run build
pnpm run migration:run
```

### Reverting Migrations

Revert the last migration:

```bash
pnpm run migration:revert
```

### Dropping Schema

Drop all tables (use with caution!):

```bash
pnpm run schema:drop
```

## Seeders

### Generating Seeders

Create a new seeder:

```bash
pnpm run seed:generate --name=user-seeder
```

### Running Seeders

Execute all seeders:

```bash
pnpm run build
pnpm run seed:run
```

Seeders are tracked in the `typeormSeeders` table to prevent duplicate runs.

## Repository Pattern

### BaseRepository

The API uses a custom `BaseRepository` class that wraps TypeORM operations:

```typescript
export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repo: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T>;
  async findMany<Options>(args: Options): Promise<T[]>;
  async findOne<Options>(args: Options): Promise<T | null>;
  async findOneOrThrow<Options>(args: Options, msg?: string): Promise<T>;
  async update(criteria: any, data: any): Promise<UpdateResult>;
  async findOneAndUpdate<Options>(args: Options, data: any): Promise<T>;
  async delete(criteria: any): Promise<DeleteResult>;
  async count<Options>(args?: Options): Promise<number>;
  async query(sql: string, params?: any[]): Promise<any>;
}
```

### Creating a Repository

```typescript
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }

  // Add custom methods here
  async findByEmail(email: string) {
    return this.findOne({ where: { email } });
  }
}
```

### Using Repositories

```typescript
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUser(id: number) {
    return this.userRepo.findOneOrThrow(
      { where: { id } },
      'User not found'
    );
  }
}
```

## Type-Safe Queries

The `BaseRepository` provides type-safe query results based on `select` options:

```typescript
// Full user object
const user = await userRepo.findOne({ where: { id: 1 } });

// Only selected fields (typed)
const user = await userRepo.findOne({
  select: { id: true, name: true },
  where: { id: 1 }
});
// user is typed as { id: number; name: string }
```

## Connection Pooling

The database connection uses a pool with the following defaults:

- **Pool Size**: 5 connections
- **Logging**: Enabled in development, disabled in production

## Best Practices

1. **Always use migrations** - Don't rely on `synchronize: true` in production
2. **Use repositories** - Don't inject TypeORM Repository directly
3. **Select only needed fields** - Improves performance and security
4. **Use transactions** - For operations that modify multiple records
5. **Index frequently queried columns** - Improve query performance
6. **Use soft deletes** - Consider adding `deletedAt` column for data recovery
