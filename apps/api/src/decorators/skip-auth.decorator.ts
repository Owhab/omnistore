import { SetMetadata } from '@nestjs/common';
import { PUBLIC, UNAUTH } from 'src/constants/skip-auth.const';

export const Unauth = () => SetMetadata(UNAUTH, true);
export const Public = () => SetMetadata(PUBLIC, true);
