import { Controller, Get, UseGuards, UseInterceptors } from "@nestjs/common";

import { EUserRole } from "@/common/enums/roles.enums";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { RoleResponse } from "./roles.dtos";
import { RolesSerializer } from "./roles.serializer";
import { RolesService } from "./roles.service";

@UseInterceptors(ResponseTransformInterceptor)
@UseGuards(JwtAuthGuard)
@Controller("roles")
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly rolesSerializer: RolesSerializer,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(EUserRole.SUPER_USER)
  async getAllRoles(): Promise<RoleResponse[]> {
    const roles = await this.rolesService.findAll();
    return this.rolesSerializer.serializeMany(roles);
  }
}
