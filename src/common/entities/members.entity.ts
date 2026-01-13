import { Entity, ManyToOne, PrimaryKey, Property, type Rel } from "@mikro-orm/core";

import { EUserRole } from "@/common/enums/roles.enums";
import { MembersRepository } from "@/modules/members/members.repository";

import { CustomBaseEntity } from "./custom-base.entity";
import { Organization } from "./organizations.entity";
import { User } from "./users.entity";

@Entity({ tableName: "members", repository: () => MembersRepository })
export class Member extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ManyToOne(() => Organization)
  organization!: Rel<Organization>;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @Property({ type: "text" })
  role!: EUserRole;
}
