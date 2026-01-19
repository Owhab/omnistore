import { Injectable, NestMiddleware } from '@nestjs/common';
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import UnauthorizedException from 'src/exceptions/unauthorized.exception';
import { EnvService } from 'src/shared/services/env.service';
import { UtilService } from 'src/shared/services/util.service';

export type RecaptchaResponse = {
  data: {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
  };
};

export type VerifyRecaptchaResponse = {
  secret: string;
  token: string;
};

@Injectable()
export class RecaptchaMiddleware implements NestMiddleware {
  constructor(
    private readonly env: EnvService,
    private readonly util: UtilService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { recaptchaToken } = req.body as { recaptchaToken?: string };

    if (!recaptchaToken) {
      throw new UnauthorizedException({
        message: 'Verification failed',
      });
    }

    const isVerified = await this.verifyRecaptcha(req, {
      secret: this.env.recaptcha.secretKey,
      token: recaptchaToken,
    });

    if (!isVerified) {
      throw new UnauthorizedException({
        message: 'You are not authorized according to our verification',
      });
    }

    next();
  }

  async verifyRecaptcha(
    req: Request,
    { secret, token }: VerifyRecaptchaResponse,
  ) {
    try {
      const response = await axios({
        url: 'https://www.google.com/recaptcha/api/siteverify',
        method: 'POST',
        params: {
          secret,
          response: token,
          remoteip: this.util.getIpAddress(req),
        },
      });

      const isVerified = this.verifyResponse(response);

      return isVerified;
    } catch {
      return false;
    }
  }

  verifyResponse(response: RecaptchaResponse) {
    const { success } = response.data;

    return success;
  }
}
