import { Body, Controller, Param, Post, UseGuards, UseInterceptors } from "@nestjs/common";

import { User } from "@/common/entities/users.entity";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { SelfRegisterUserDto, UserResponse } from "../users/users.dtos";
import { UsersSerializer } from "../users/users.serializer";
import { UsersService } from "../users/users.service";
import { FORGOT_PASSWORD_EMAIL_SENT_MESSAGE } from "./auth.constants";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  SendForgotPasswordEmailResponse,
  SignInResponse,
} from "./auth.dtos";
import { makeTokenizedUser } from "./auth.helpers";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LocalAuthGuard } from "./guards/local-auth.guard";

@Controller("auth")
@UseInterceptors(ResponseTransformInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly usersSerializer: UsersSerializer,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post("sign-in")
  async signIn(@CurrentUser() user: User): Promise<SignInResponse> {
    const accessToken = await this.authService.createAccessToken(user);

    return {
      accessToken,
      user: makeTokenizedUser(user),
    };
  }

  @Post("sign-up")
  async signUp(@Body() selfRegisterUserDto: SelfRegisterUserDto): Promise<UserResponse> {
    const newUser = await this.usersService.selfRegister(selfRegisterUserDto);

    return this.usersSerializer.serialize(newUser);
  }

  @Post("forgot-password")
  async sendForgotPasswordEmail(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<SendForgotPasswordEmailResponse> {
    await this.authService.sendForgotPasswordEmail(forgotPasswordDto.email);

    return { message: FORGOT_PASSWORD_EMAIL_SENT_MESSAGE };
  }

  @Post("reset-password/:token")
  async resetPasswordByToken(
    @Param("token") token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<UserResponse> {
    const user = await this.authService.resetPasswordByToken(token, resetPasswordDto.password);

    return this.usersSerializer.serialize(user);
  }
}
