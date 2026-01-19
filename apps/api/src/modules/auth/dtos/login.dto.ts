import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Trim } from 'src/utils/transformers/trim.decorator';
import { ValidationMessages } from 'src/utils/validators/validation-message';

export class LoginDto {
  @IsNotEmpty({
    message: 'Email is required',
  })
  @Trim()
  @ApiProperty()
  email: string;

  @MaxLength(64, {
    message: ValidationMessages.maxLength('Password', 64),
  })
  @MinLength(4, {
    message: ValidationMessages.minLength('Password', 4),
  })
  @IsNotEmpty({
    message: 'Password is required',
  })
  @Trim()
  @ApiProperty()
  password: string;
}
