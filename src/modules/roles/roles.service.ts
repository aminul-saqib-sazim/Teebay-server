import { Injectable } from "@nestjs/common";

import { EUserRole } from "@/common/enums/roles.enums";

@Injectable()
export class RolesService {
  getRoles(): EUserRole[] {
    return Object.values(EUserRole);
  }
}
