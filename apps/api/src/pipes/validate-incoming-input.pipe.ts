import { Injectable, ValidationError, ValidationPipe } from '@nestjs/common';

import UnprocessableException from 'src/exceptions/unprocessable.exception';

function exceptionFactory(validationErrors: ValidationError[]) {
  const errors: Record<string, string> = {};

  function mapErrors(errorList: ValidationError[], parentPath = '') {
    for (const error of errorList) {
      const propertyPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        errors[propertyPath] = Object.values(error.constraints).join(', ');
      }

      if (error.children?.length) {
        mapErrors(error.children, propertyPath);
      }
    }
  }

  mapErrors(validationErrors);

  return new UnprocessableException(errors);
}

@Injectable()
export class ValidateIncomingInput extends ValidationPipe {
  constructor(options: Record<string, any>) {
    options = {
      ...options,
      stopAtFirstError: true,
      whitelist: true,
      exceptionFactory: exceptionFactory,
      transform: true,
    };
    super(options);
  }
}
