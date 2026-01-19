import { Injectable } from '@nestjs/common';
import { RolesEnum } from 'src/constants/role.enum';
import BadRequestException from 'src/exceptions/bad-request.exception';
import NotFoundException from 'src/exceptions/not-found.exception';
import UnauthenticatedException from 'src/exceptions/unauthenticated.exception';
import { TokenService } from 'src/shared/services/token.service';
import { UserRepository } from '../user/user.repo';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/registration.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly token: TokenService,
    private userRepo: UserRepository,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, name, role } = dto;

    const newUser = await this.userRepo.create({
      name,
      email,
      password,
      role,
      isVerified: dto.role === RolesEnum.USER ? true : false,
    });

    const token = await this.token.signToken({
      id: newUser.id,
    });

    const authUser = await this.getAuthUser(newUser.id);

    return {
      user: authUser,
      token,
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userRepo.findOne({
      select: {
        id: true,
        password: true,
      },
      where: { email },
    });

    if (!user || !user.password) {
      throw new NotFoundException({
        email: 'Email and password does not match',
        password: 'Email and password does not match',
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      throw new BadRequestException({
        email: 'Email and password does not match',
        password: 'Email and password does not match',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...restUser } = user;

    const token = await this.token.signToken(restUser);
    const authUser = await this.getAuthUser(user.id);

    return {
      user: authUser,
      token,
    };
  }

  async authAccount(token: string) {
    if (!token) {
      throw new BadRequestException('Invalid request');
    }

    const payload = this.token.decodeToken(token);

    if (!payload.isValid) {
      throw new UnauthenticatedException('You are not authenticated');
    }

    const user = await this.userRepo.findOne({
      select: { id: true },
      where: { id: payload.decoded?.id },
    });

    if (!user) {
      throw new NotFoundException('Invalid user');
    }

    const authUser = await this.getAuthUser(user.id);

    return {
      user: authUser,
    };
  }

  async getAuthUser(userId: number) {
    const [user] = await this.userRepo.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
      },
      where: { id: userId },
    });

    return user;
  }
}
