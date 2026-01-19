import { Global, Module, Provider } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { TokenService } from 'src/shared/services/token.service';
import { IsUniqueConstraint } from 'src/utils/validators/is-unique.validator';
import { EncryptionService } from './services/encryption.service';
import { EnvService } from './services/env.service';
import { GeneratorService } from './services/generator.service';
import { UtilService } from './services/util.service';

const providers: Provider[] = [
  JwtService,
  TokenService,
  EnvService,
  GeneratorService,
  EncryptionService,
  UtilService,
  IsUniqueConstraint,
];

@Global()
@Module({
  imports: [RedisModule],
  providers,
  exports: [...providers],
})
export class SharedModule {}
