import {
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Rel,
} from "@mikro-orm/core";

import { PermissionsRepository } from "@/permissions/permissions.repository";

import { EPermission } from "../enums/roles.enums";
import { CustomBaseEntity } from "./custom-base.entity";
import { Role } from "./roles.entity";
import { User } from "./users.entity";

@Entity({
  tableName: "permissions",
  repository: () => PermissionsRepository,
})
export class Permission extends CustomBaseEntity {
  [EntityRepositoryType]?: PermissionsRepository;

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

  @ManyToOne(() => User, { fieldName: "created_by", nullable: true })
  createdBy?: Rel<User> | null;

  @ManyToOne(() => User, { fieldName: "updated_by", nullable: true })
  updatedBy?: Rel<User> | null;
}
