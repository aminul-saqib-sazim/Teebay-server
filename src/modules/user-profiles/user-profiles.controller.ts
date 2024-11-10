import { Body, Controller, Get, Patch, UseGuards, UseInterceptors } from "@nestjs/common";

import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { ITokenizedUser } from "../auth/auth.interfaces";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserProfileResponse, UpdateUserProfileDto } from "./user-profiles.dtos";
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

  @Get("me")
  async getUserProfile(@CurrentUser() user: ITokenizedUser): Promise<UserProfileResponse> {
    const userProfile = await this.userProfilesService.getUserProfile(user.id);

    return this.userProfilesSerializer.serialize(userProfile);
  }

  @Patch("me")
  async updateUserProfile(
    @CurrentUser() user: ITokenizedUser,
    @Body() body: UpdateUserProfileDto,
  ): Promise<UserProfileResponse> {
    const updatedUserProfile = await this.userProfilesService.updateUserProfile(user.id, body);

    return this.userProfilesSerializer.serialize(updatedUserProfile);
  }
}
