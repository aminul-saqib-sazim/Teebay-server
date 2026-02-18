import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access";

import { EUserRole } from "@/common/enums/roles.enums";

import { EPermission } from "./permissions.enums";
import type { TPermission } from "./permissions.types";

export const STATEMENT = {
  ...defaultStatements,
  user: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
  role: [EPermission.READ, EPermission.UPDATE],
  product: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
} as const;

export const ac = createAccessControl(STATEMENT);

export const owner = ac.newRole({
  ...ownerAc.statements,
  user: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
  role: [EPermission.READ, EPermission.UPDATE],
  product: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  user: [EPermission.READ, EPermission.UPDATE],
  role: [EPermission.READ],
  product: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
});

export const member = ac.newRole({
  ...memberAc.statements,
  user: [EPermission.READ],
  product: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
});

export const ROLE_BASED_PERMISSIONS: Record<EUserRole, TPermission> = {
  [EUserRole.OWNER]: {
    organization: [EPermission.UPDATE, EPermission.DELETE],
    member: [EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
    invitation: [EPermission.CREATE, EPermission.CANCEL],
    user: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
    role: [EPermission.READ, EPermission.UPDATE],
    product: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
  },
  [EUserRole.ADMIN]: {
    organization: [EPermission.UPDATE],
    member: [EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
    invitation: [EPermission.CREATE, EPermission.CANCEL],
    user: [EPermission.READ, EPermission.UPDATE],
    role: [EPermission.READ],
    product: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
  },
  [EUserRole.MEMBER]: {
    user: [EPermission.READ],
    product: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
  },
};
