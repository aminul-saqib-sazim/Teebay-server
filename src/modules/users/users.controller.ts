import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import type { Request } from "express";

import { Permissions } from "@/common/decorators/auth/permissions.decorator";
import { PermissionsGuard } from "@/common/guards/permissions.guard";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";
import { EPermission } from "@/modules/permissions/permissions.enums";

import { InviteUserDto, ListUsersQueryDto, UpdateProfileDto, UpdateUserDto } from "./users.dtos";
import type {
  IInviteUserResponse,
  IPaginatedUsersResponse,
  IUserResponse,
} from "./users.interface";
import { UsersService } from "./users.service";

@Controller("users")
@UseInterceptors(ResponseTransformInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getMe(@Req() req: Request): Promise<IUserResponse> {
    return this.usersService.getCurrentUser(req.user!.id);
  }

  @Patch("me")
  async updateMe(@Req() req: Request, @Body() dto: UpdateProfileDto): Promise<IUserResponse> {
    return this.usersService.updateProfile(req.user!.id, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions({ user: [EPermission.READ] })
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @Req() req: Request,
  ): Promise<IPaginatedUsersResponse> {
    const organizationId = req.session?.session.activeOrganizationId;

    if (!organizationId) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }

    return this.usersService.listUsers(query, organizationId);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions({ user: [EPermission.CREATE] })
  inviteUser(@Body() dto: InviteUserDto, @Req() req: Request): Promise<IInviteUserResponse> {
    const organizationId = req.session?.session.activeOrganizationId;

    if (!organizationId) {
      return Promise.resolve({
        success: false,
        message: "No active organization",
      });
    }

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    return this.usersService.inviteUser(dto, organizationId, headers);
  }

  @Patch(":id")
  @UseGuards(PermissionsGuard)
  @Permissions({ user: [EPermission.UPDATE] })
  async updateUser(
    @Param("id") userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<IUserResponse> {
    return this.usersService.updateUser(userId, dto);
  }
}
