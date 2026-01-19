import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EnvService } from 'src/shared/services/env.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor(private env: EnvService) {}

  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.env.redisConfig.host,
      port: this.env.redisConfig.port,
      password: this.env.redisConfig.password,
    });

    this.redisClient.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });

    this.redisClient.on('connect', function () {
      console.log('Connected to the Redis Server');
    });

    this.redisClient.on('ready', function () {
      console.log('Redis Instance is Ready!');
    });

    return this.redisClient;
  }

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  async get(prefix: string, key: string): Promise<string | null> {
    return this.redisClient.get(`${prefix}:${key}`);
  }

  async set(prefix: string, key: string, value: string): Promise<void> {
    await this.redisClient.set(`${prefix}:${key}`, value);
  }

  async delete(prefix: string, key: string): Promise<void> {
    await this.redisClient.del(`${prefix}:${key}`);
  }

  async setWithExpiry(
    prefix: string,
    key: string,
    value: string,
    expiry: number,
  ): Promise<void> {
    await this.redisClient.set(`${prefix}:${key}`, value, 'EX', expiry);
  }
}
