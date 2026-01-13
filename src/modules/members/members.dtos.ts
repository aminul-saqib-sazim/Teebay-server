import { IsEnum, IsString } from "class-validator";

import { EUserRole } from "@/common/enums/roles.enums";

export class UpdateMemberRoleDto {
  @IsString()
  userId!: string;

  @IsEnum(EUserRole)
  role!: EUserRole;
}
