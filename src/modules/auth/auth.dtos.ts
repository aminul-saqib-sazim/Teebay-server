import { IsEmail, IsString, MinLength } from "class-validator";

import { TokenizedUser } from "@/modules/users/users.dtos";

export class ForgotPasswordDto {
  @IsString()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

export class SendForgotPasswordEmailResponse {
  message!: string;
}

export class SignInResponse {
  accessToken!: string;
  user!: TokenizedUser;
}
