import { Permission } from "@/common/entities/permissions.entity";
import { Role } from "@/common/entities/roles.entity";

export class RoleResponse {
  id!: number;
  createdAt!: string;
  updatedAt!: string;
  name!: string;
}

export class RolesWithUsersCount {
  role!: Role;
  activeUsersCount!: number;
  inactiveUsersCount!: number;
}

export class RolesWithUsersAndPermissionsResponse {
  roles!: RolesWithUsersCount[];
  permissions!: Permission[];
}

export class updateRolesPermissionsDto {
  roleId!: number;
  permissionsToRemoveIds!: number[];
  permissionsToAddIds!: number[];
}
