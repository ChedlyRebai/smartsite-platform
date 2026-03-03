import { IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  cin: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  recaptchaToken?: string;
}