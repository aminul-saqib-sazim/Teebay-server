import { Collection, Entity, Enum, ManyToMany, PrimaryKey } from "@mikro-orm/core";

import { EPermission } from "../enums/roles.enums";
import { CustomBaseEntity } from "./custom-base.entity";
import { Role } from "./roles.entity";

@Entity({
  tableName: "permissions",
})
export class Permission extends CustomBaseEntity {
  constructor(name: EPermission) {
    super();
    this.name = name;
  }

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Enum(() => EPermission)
  name!: EPermission;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles = new Collection<Role>(this);
}
