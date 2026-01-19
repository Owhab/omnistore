import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PUBLIC, UNAUTH } from 'src/constants/skip-auth.const';
import UnauthenticatedException from 'src/exceptions/unauthenticated.exception';
import { UserRepository } from 'src/modules/user/user.repo';
import { TokenService } from 'src/shared/services/token.service';

export type ReqAccount = {
  id: number;
  name: string;
  email: string;
  permissions: string[];
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private token: TokenService,
    private reflector: Reflector,
    private userRepo: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isUnauth = this.reflector.getAllAndOverride<boolean>(UNAUTH, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isUnauth || isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.token.extract(request);

    if (isPublic) {
      if (token) request.token = token;

      return true;
    }

    if (!token) {
      throw new UnauthenticatedException({
        message: 'You need to sign in first.',
      });
    }

    const payload = this.token.decodeToken(token);

    if (!payload.isValid || !payload.decoded) {
      throw new UnauthenticatedException({
        message: 'Invalid login',
      });
    }

    const user = await this.userRepo.findOne({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
      },
      where: { id: payload.decoded.id },
    });

    if (!user) {
      throw new UnauthenticatedException({
        message: 'You are not authenticated',
      });
    }

    if (!user.isVerified) {
      throw new UnauthenticatedException({
        message: 'Your account is not verified',
      });
    }

    request.user = user.toJSON();
    request.token = token;

    return true;
  }
}
