import { Controller, Post, UseGuards, UseInterceptors } from "@nestjs/common";

import { User } from "@/common/entities/users.entity";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { SignInResponse } from "./auth.dtos";
import { makeTokenizedUser } from "./auth.helpers";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LocalAuthGuard } from "./guards/local-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @UseInterceptors(ResponseTransformInterceptor)
  @Post("sign-in")
  async signIn(@CurrentUser() user: User): Promise<SignInResponse> {
    const accessToken = await this.authService.createAccessToken(user);

    return {
      accessToken,
      user: makeTokenizedUser(user),
    };
  }
}
