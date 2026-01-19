// import Joi from "joi";

// export const configValidationSchema = Joi.object({
//   NODE_ENV: Joi.string()
//     .valid("development", "production")
//     .default("development"),
//   API_PORT: Joi.number().port().default(4000),

//   APP_URL: Joi.string().uri().required(),

//   DB_HOST: Joi.string().hostname().required(),

//   DB_PORT: Joi.number().port().required(),

//   DB_DATABASE: Joi.string().required(),

//   DB_USERNAME: Joi.string().required(),

//   DB_PASSWORD: Joi.string().required(),

//   JWT_SECRET: Joi.string().min(8).required(),

//   ENCRYPTION_SECRET: Joi.string().min(8).required(),

//   REDIS_HOST: Joi.string().hostname().required(),

//   REDIS_PORT: Joi.number().port().required(),

//   REDIS_USER: Joi.string().required(),

//   REDIS_PASSWORD: Joi.string().required(),
// });

import chalk from 'chalk';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  API_PORT: number;

  @IsString()
  @IsNotEmpty()
  APP_URL: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  ENCRYPTION_SECRET: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsString()
  @IsNotEmpty()
  REDIS_USER: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  SMTP_URL: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_RECAPTCHA_SECRET_KEY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : '';
        return `  ✖ ${chalk.bold(err.property)}: ${constraints}`;
      })
      .join('\n');

    console.log(
      '\n' +
        chalk.bgRed.white.bold(' ENVIRONMENT CONFIGURATION ERROR ') +
        '\n\n' +
        message +
        '\n\n' +
        chalk.yellowBright('💡 Please check your .env file and try again.\n'),
    );

    process.exit(1);
  }
  return validatedConfig;
}
