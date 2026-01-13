import { Entity, ManyToOne, PrimaryKey, Property, type Rel } from "@mikro-orm/core";

import type { InvitationStatus } from "better-auth/plugins";

import { CustomBaseEntity } from "./custom-base.entity";
import { Organization } from "./organizations.entity";
import { User } from "./users.entity";

@Entity({ tableName: "invitations" })
export class Invitation extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ManyToOne(() => Organization)
  organization!: Rel<Organization>;

  @Property()
  email!: string;

  @Property({ type: "text" })
  role!: string;

  @Property({ type: "text" })
  status!: InvitationStatus;

  @Property()
  expiresAt!: Date;

  @ManyToOne(() => User)
  inviter!: Rel<User>;
}
