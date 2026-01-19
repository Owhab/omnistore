import { HttpStatus } from '@nestjs/common';

import AppException from './app.exception';

export default class UnauthorizedException<
  K extends string,
  V,
> extends AppException<K, V> {
  constructor(message: string | Record<K, V>) {
    super(message, {
      code: 'Unauthorized',
      status: HttpStatus.FORBIDDEN,
    });
  }
}
