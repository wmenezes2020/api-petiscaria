import { IsString, MinLength } from 'class-validator';

export class TwoFactorTokenDto {
  @IsString()
  @MinLength(6)
  token: string;
}


