import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { PUBLIC } from 'src/constants/skip-auth.const';
import UnauthorizedException from 'src/exceptions/unauthorized.exception';
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class UnauthGuard implements CanActivate {
  constructor(
    private token: TokenService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.token.extract(request);

    if (token) {
      throw new UnauthorizedException({
        message: 'You are already signed in',
      });
    }

    return true;
  }
}
