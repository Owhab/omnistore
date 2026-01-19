import { User } from 'src/modules/user/user.entity';

declare module 'express' {
  export interface Request {
    user?: Partial<User>;
    token?: string;
  }
}
