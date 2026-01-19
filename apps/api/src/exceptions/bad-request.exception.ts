import { HttpStatus } from '@nestjs/common';

import AppException from './app.exception';

export default class BadRequestException<
  K extends string,
  V,
> extends AppException<K, V> {
  constructor(message: string | Record<K, V>) {
    super(message, {
      code: 'BadRequest',
      status: HttpStatus.BAD_REQUEST,
    });
  }
}
