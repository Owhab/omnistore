import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RolesEnum } from 'src/constants/role.enum';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import UnauthenticatedException from 'src/exceptions/unauthenticated.exception';
import UnauthorizedException from 'src/exceptions/unauthorized.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permittedRole = this.reflector.getAllAndOverride<
      RolesEnum[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!permittedRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw new UnauthenticatedException({
        message: 'User not authenticated',
      });
    }

    const userRole = request.user.role as RolesEnum;

    if (!permittedRole.includes(userRole)) {
      throw new UnauthorizedException({
        message: 'Permission denied',
      });
    }

    return true;
  }
}
