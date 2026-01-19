import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import isNil from 'lodash/isNil';

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService) {}

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (isNil(value)) {
      throw new Error(key + ' environment variable does not set'); // probably we should call process.exit() too to avoid locking the service
    }

    return value;
  }

  private getNumber(key: string): number {
    const value = this.get(key);

    try {
      return Number(value);
    } catch {
      throw new Error(key + ' environment variable is not a number');
    }
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(key + ' env var is not a boolean');
    }
  }

  private getString(key: string): string {
    const value = this.get(key);

    if (typeof value !== 'string') {
      if (value === undefined || value === null) {
        throw new Error(`Env variable ${key} is not set`);
      }
      return String(value).replace(/\\n/g, '\n');
    }
    return value.replace(/\\n/g, '\n');
  }

  get appConfig() {
    return {
      port: this.getString('API_PORT'),
    };
  }

  get corsConfig() {
    const origin = this.isProduction ? this.getString('APP_URL') : true;

    return {
      origin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-Requested-With',
        'X-Factor-Auth',
      ],
      optionsSuccessStatus: HttpStatus.OK,
      credentials: true,
    };
  }

  get dbConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
      subscribers: [__dirname + '/../../**/*.subscriber{.ts,.js}'],
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../../../database/migrations/*{.ts,.js}'],
      migrationsTableName: 'migrations',
      poolSize: 5,
      logging: !this.isProduction,
    };
  }

  get authConfig() {
    return {
      jwtSecret: this.getString('JWT_SECRET'),
      encryptionSecret: this.getString('ENCRYPTION_SECRET'),
    };
  }

  get redisConfig() {
    return {
      host: this.getString('REDIS_HOST'),
      port: this.getNumber('REDIS_PORT'),
      password: this.getString('REDIS_PASSWORD'),
      url: `redis://${this.getString('REDIS_USER')}:${this.getString('REDIS_PASSWORD')}@${this.getString('REDIS_HOST')}:${this.getNumber('REDIS_PORT')}`,
    };
  }

  get smtp() {
    return {
      url: this.getString('SMTP_URL'),
    };
  }

  get recaptcha() {
    return {
      secretKey: this.getString('GOOGLE_RECAPTCHA_SECRET_KEY'),
    };
  }
}
