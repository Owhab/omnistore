import { HttpStatus } from '@nestjs/common';

import AppException from './app.exception';

export default class ThrottlerException<
  K extends string,
  V,
> extends AppException<K, V> {
  constructor(message: string | Record<K, V>) {
    super(message, {
      code: 'ThrottlerException',
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
