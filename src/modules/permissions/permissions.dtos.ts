import { IsNotEmpty, IsObject } from "class-validator";

import type { EPermission } from "./permissions.enums";

export class CheckPermissionsDto {
  @IsObject()
  @IsNotEmpty()
  permissions!: Record<string, EPermission[]>;
}
