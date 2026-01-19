import { UseGuards, applyDecorators } from '@nestjs/common';
import { UnauthGuard } from 'src/guards/unauth.guard';
import { Unauth } from './skip-auth.decorator';

export function UseUnauthGuard() {
  return applyDecorators(Unauth(), UseGuards(UnauthGuard));
}
