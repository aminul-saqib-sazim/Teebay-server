import { Injectable } from "@nestjs/common";

import type { EUserRole } from "@/common/enums/roles.enums";

import { ROLE_BASED_PERMISSIONS } from "./permissions.constants";
import type { EPermission } from "./permissions.enums";
import type { TPermission } from "./permissions.types";

@Injectable()
export class PermissionsService {
  checkPermissions(role: EUserRole, requiredPermissions: Record<string, EPermission[]>): boolean {
    const userPermissions = ROLE_BASED_PERMISSIONS[role];

    if (!userPermissions) {
      return false;
    }

    for (const [resource, actions] of Object.entries(requiredPermissions)) {
      const allowedActions = userPermissions[resource as keyof TPermission] as
        | readonly string[]
        | undefined;

      if (!allowedActions) {
        return false;
      }

      for (const action of actions) {
        if (!allowedActions.includes(action)) {
          return false;
        }
      }
    }

    return true;
  }
}
