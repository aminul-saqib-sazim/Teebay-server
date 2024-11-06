import { Body, Controller, Patch, UseGuards, UseInterceptors } from "@nestjs/common";

import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { ITokenizedUser } from "../auth/auth.interfaces";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserProfileUpdateDto } from "./user-profiles.dtos";
import { UserProfilesSerializer } from "./user-profiles.serializer";
import { UserProfilesService } from "./user-profiles.service";

@UseInterceptors(ResponseTransformInterceptor)
@UseGuards(JwtAuthGuard)
@Controller("user-profiles")
export class UserProfilesController {
  constructor(
    private readonly userProfilesService: UserProfilesService,
    private readonly userProfilesSerializer: UserProfilesSerializer,
  ) {}

  @Patch("me")
  async updateUserProfile(@CurrentUser() user: ITokenizedUser, @Body() body: UserProfileUpdateDto) {
    const updatedUserProfile = await this.userProfilesService.updateUserProfile(user.id, body);

    return this.userProfilesSerializer.serialize(updatedUserProfile);
  }
}
