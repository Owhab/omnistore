import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { User } from 'src/modules/user/user.entity';
import { EnvService } from 'src/shared/services/env.service';
import { EncryptionService } from './encryption.service';

export type JwtPayload = {
  id: number;
  username: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private env: EnvService,
    private encryption: EncryptionService,
  ) {}

  public extract(request: Request): string | null {
    const [type, encryptedToken] =
      request.headers.authorization?.split(' ') ?? [];
    const token = type === 'Bearer' ? encryptedToken : null;

    if (!token) return null;

    const decrypted = this.encryption.decrypt(token);

    return decrypted;
  }

  public async signToken(user: Partial<User>) {
    const data = {
      id: user.id,
    };

    const token = await this.jwt.signAsync(data, {
      expiresIn: '7d',
      secret: this.env.authConfig.jwtSecret,
    });

    const encrypted = this.encryption.encrypt(token);

    return encrypted;
  }

  public decodeToken(token: string) {
    try {
      const decoded = this.jwt.verify<JwtPayload>(token, {
        secret: this.env.authConfig.jwtSecret,
      });

      return {
        isValid: true,
        decoded,
      };
    } catch (error: unknown) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
