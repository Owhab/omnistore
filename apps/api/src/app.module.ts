import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  RouterModule,
} from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import path from "path";
import { validate } from "./config/config.schema";
import { AppExceptionFilter } from "./filters/app-exception.filter";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import { AuthGuard } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { QueueModule } from "./modules/queue/queue.module";
import { UserModule } from "./modules/user/user.module";
import { ValidateIncomingInput } from "./pipes/validate-incoming-input.pipe";
import routes from "./routes";
import { EnvService } from "./shared/services/env.service";
import { SharedModule } from "./shared/shared.module";

@Module({
  imports: [
    RouterModule.register(routes),
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: validate,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 5,
          blockDuration: 3600000,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (envService: EnvService) => envService.dbConfig,
      inject: [EnvService],
    }),
    MailerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (envService: EnvService) => {
        return {
          transport: envService.smtp.url,
          template: {
            dir: path.join(__dirname, "templates"),
            adapter: new HandlebarsAdapter(),
          },
        };
      },
    }),
    QueueModule.register(),
    SharedModule,
    AuthModule,
    UserModule,
    ProfileModule,
    QueueModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidateIncomingInput,
    },
    // Global exception filter should be placed at first
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Other exception filters should be placed after global exception filter
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
