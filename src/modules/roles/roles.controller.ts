import { Controller, Get, UseGuards, UseInterceptors } from "@nestjs/common";

import { Permissions } from "@/common/decorators/auth/permissions.decorator";
import type { EUserRole } from "@/common/enums/roles.enums";
import { PermissionsGuard } from "@/common/guards/permissions.guard";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";
import { EPermission } from "@/modules/permissions/permissions.enums";

import { RolesService } from "./roles.service";

@Controller("roles")
@UseInterceptors(ResponseTransformInterceptor)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions({ role: [EPermission.READ] })
  getRoles(): EUserRole[] {
    return this.rolesService.getRoles();
  }
}
