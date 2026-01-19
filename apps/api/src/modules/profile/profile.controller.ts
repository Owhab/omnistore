import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { User } from '../user/user.entity';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@Controller({
  version: '1',
})
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ResponseMessage('Profile retrieved successfully')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profile retrieved' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getProfile(@AuthUser() user: Partial<User>) {
    return this.profileService.getProfile(user.id as number);
  }
}
