import { HttpException, HttpStatus } from '@nestjs/common';

type IAppError = {
  code?: string;
  status?: number;
};

export default class AppException<K extends string, V> extends HttpException {
  constructor(
    message: string | Record<K, V>,
    {
      code = 'InternalServerError',
      status = HttpStatus.INTERNAL_SERVER_ERROR,
    }: IAppError = {},
  ) {
    super(
      {
        message: message,
        code: code,
      },
      status,
    );
  }
}
