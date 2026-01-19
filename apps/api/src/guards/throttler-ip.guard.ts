import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { fromMs } from 'ms-typescript';
import ThrottlerException from 'src/exceptions/throttler.exception';

@Injectable()
export class ThrottlerIpGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    return Promise.resolve(req.ips.length ? req.ips[0] : req.ip || '');
  }

  protected throwThrottlingException(context: ExecutionContext): Promise<void> {
    const remainingTime = context
      .switchToHttp()
      .getResponse<Response>()
      .get('Retry-After');
    if (!remainingTime) return Promise.resolve();

    const remainingTimeInMinute = fromMs(Number(remainingTime) * 1000, {
      long: true,
    });

    throw new ThrottlerException({
      message: `Too many requests. Please try again after ${remainingTimeInMinute}`,
    });
  }
}
