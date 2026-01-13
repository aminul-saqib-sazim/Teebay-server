import { SetMetadata } from "@nestjs/common";

import type { TPermission } from "@/modules/permissions/permissions.types";

export const PERMISSIONS_KEY = "permissions";

export const Permissions = (permission: TPermission) => SetMetadata(PERMISSIONS_KEY, permission);
