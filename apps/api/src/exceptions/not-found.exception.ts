import { HttpStatus } from '@nestjs/common';

import AppException from './app.exception';

export default class NotFoundException<
  K extends string,
  V,
> extends AppException<K, V> {
  constructor(message: string | Record<K, V>) {
    super(message, {
      code: 'NotFound',
      status: HttpStatus.NOT_FOUND,
    });
  }
}
