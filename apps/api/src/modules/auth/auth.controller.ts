import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AccessToken } from 'src/decorators/access-token.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Public } from 'src/decorators/skip-auth.decorator';
import { UseUnauthGuard } from 'src/decorators/use-unauth.decorator';
import { ThrottlerIpGuard } from '../../guards/throttler-ip.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/registration.dto';

@ApiTags('auth')
@Controller({
  version: '1',
})
@UseGuards(ThrottlerIpGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseUnauthGuard()
  @ResponseMessage('Registration successful')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'User has been registered' })
  @ApiBadRequestResponse({ description: 'Invalid input or not allowed role' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseUnauthGuard()
  @ResponseMessage('Login successful')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'User has been logged successfully' })
  @ApiNotFoundResponse({
    description: 'Username and password does not matched',
  })
  @ApiBadRequestResponse({
    description: 'Username and password does not matched',
  })
  login(@Body() loginUserDto: LoginDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('load')
  @Public()
  @ResponseMessage('Loaded user')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User has been logged successfully' })
  @ApiNotFoundResponse({ description: 'Invalid user' })
  @ApiUnauthorizedResponse({ description: 'You are not authenticated' })
  loadUser(@AccessToken() token: string) {
    return this.authService.authAccount(token);
  }
}
