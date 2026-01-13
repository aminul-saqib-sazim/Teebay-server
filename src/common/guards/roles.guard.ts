import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { Request } from "express";

import { ROLES_KEY } from "@/common/decorators/auth/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const session = (
      request as Request & { session?: { session?: { activeOrganizationId?: string } } }
    ).session;

    if (!session?.session?.activeOrganizationId) {
      throw new ForbiddenException("No active organization found");
    }

    const userRole = (session as { session: { activeOrganizationRole?: string } }).session
      .activeOrganizationRole;

    if (!userRole) {
      throw new ForbiddenException("User has no role in the organization");
    }

    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `User role '${userRole}' is not authorized. Required roles: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
