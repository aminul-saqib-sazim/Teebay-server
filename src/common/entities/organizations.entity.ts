import { Collection, Entity, OneToMany, PrimaryKey, Property, Unique } from "@mikro-orm/core";

import { CustomBaseEntity } from "./custom-base.entity";
import { Invitation } from "./invitations.entity";
import { Member } from "./members.entity";

@Entity({ tableName: "organizations" })
export class Organization extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Property()
  name!: string;

  @Property()
  @Unique()
  slug!: string;

  @Property({ nullable: true })
  logo?: string;

  @Property({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => Member, (member) => member.organization)
  members = new Collection<Member>(this);

  @OneToMany(() => Invitation, (invitation) => invitation.organization)
  invitations = new Collection<Invitation>(this);
}
