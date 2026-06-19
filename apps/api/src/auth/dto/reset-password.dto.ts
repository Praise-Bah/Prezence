import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, {
    message: 'newPassword must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, { message: 'newPassword must contain at least one number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'newPassword must contain at least one special character',
  })
  newPassword!: string;
}
