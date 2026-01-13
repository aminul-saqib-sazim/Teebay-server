import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseInterceptors } from "@nestjs/common";

import type { Request } from "express";

import type { EUserRole } from "@/common/enums/roles.enums";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { CheckPermissionsDto } from "./permissions.dtos";
import type { ICheckPermissionsResponse } from "./permissions.interface";
import { PermissionsService } from "./permissions.service";

@Controller("permissions")
@UseInterceptors(ResponseTransformInterceptor)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post("check")
  @HttpCode(HttpStatus.OK)
  checkPermissions(
    @Body() dto: CheckPermissionsDto,
    @Req() req: Request,
  ): ICheckPermissionsResponse {
    const session = req.session as { session?: { activeOrganizationRole?: string } } | undefined;

    const userRole = session?.session?.activeOrganizationRole as EUserRole | undefined;

    if (!userRole) {
      return { hasPermission: false };
    }

    const hasPermission = this.permissionsService.checkPermissions(userRole, dto.permissions);

    return { hasPermission };
  }
}
