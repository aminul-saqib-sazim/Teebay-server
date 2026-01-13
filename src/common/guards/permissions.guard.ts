import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { Request } from "express";

import { PERMISSIONS_KEY } from "@/common/decorators/auth/permissions.decorator";
import type { EUserRole } from "@/common/enums/roles.enums";
import { ROLE_BASED_PERMISSIONS } from "@/modules/permissions/permissions.constants";
import type { TPermission } from "@/modules/permissions/permissions.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<TPermission>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const session = (
      request as Request & {
        session?: { session?: { activeOrganizationId?: string } };
      }
    ).session;

    if (!session?.session?.activeOrganizationId) {
      throw new ForbiddenException("No active organization found");
    }

    const userRole = (session as { session: { activeOrganizationRole?: string } }).session
      .activeOrganizationRole as EUserRole | undefined;

    if (!userRole) {
      throw new ForbiddenException("User has no role in the organization");
    }

    const userPermissions = ROLE_BASED_PERMISSIONS[userRole];

    if (!userPermissions) {
      throw new ForbiddenException(`Unknown role: ${userRole}`);
    }

    for (const [resource, actions] of Object.entries(requiredPermissions)) {
      const allowedActions = userPermissions[resource as keyof TPermission] as
        | readonly string[]
        | undefined;

      if (!allowedActions) {
        throw new ForbiddenException(
          `User role '${userRole}' does not have access to resource '${resource}'`,
        );
      }

      for (const action of actions as string[]) {
        if (!allowedActions.includes(action)) {
          throw new ForbiddenException(
            `User role '${userRole}' does not have '${action}' permission on '${resource}'`,
          );
        }
      }
    }

    return true;
  }
}
