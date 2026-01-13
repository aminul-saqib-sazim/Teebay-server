import { Body, Controller, Patch, Req, UseGuards, UseInterceptors } from "@nestjs/common";

import type { Request } from "express";

import { Permissions } from "@/common/decorators/auth/permissions.decorator";
import { PermissionsGuard } from "@/common/guards/permissions.guard";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";
import { EPermission } from "@/modules/permissions/permissions.enums";

import { UpdateMemberRoleDto } from "./members.dtos";
import type { IUpdateMemberRoleResponse } from "./members.interface";
import { MembersService } from "./members.service";

@Controller("members")
@UseInterceptors(ResponseTransformInterceptor)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Patch()
  @UseGuards(PermissionsGuard)
  @Permissions({ role: [EPermission.UPDATE] })
  async updateMemberRole(
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: Request,
  ): Promise<IUpdateMemberRoleResponse> {
    const organizationId = req.session?.session.activeOrganizationId;

    if (!organizationId) {
      return {
        success: false,
        message: "No active organization",
      };
    }

    return this.membersService.updateMemberRole(dto, organizationId);
  }
}
