import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repo';

@Injectable()
export class ProfileService {
  constructor(private userRepo: UserRepository) {}

  async getProfile(id: number) {
    return this.userRepo.findOneOrThrow(
      {
        where: { id },
      },
      'User not found',
    );
  }
}
