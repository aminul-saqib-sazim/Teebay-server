import { Collection, Entity, Enum, OneToMany, PrimaryKey, Property, Unique } from "@mikro-orm/core";

import { EUserState } from "@/common/enums/users.enums";
import { UsersRepository } from "@/modules/users/users.repository";

import { Account } from "./accounts.entity";
import { CustomBaseEntity } from "./custom-base.entity";
import { Member } from "./members.entity";
import { Session } from "./sessions.entity";

@Entity({ tableName: "users", repository: () => UsersRepository })
export class User extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Property()
  @Unique()
  email!: string;

  @Property({ default: false })
  emailVerified!: boolean;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  name!: string;

  @Property({ nullable: true })
  image?: string;

  @Enum(() => EUserState)
  state: EUserState = EUserState.ACTIVE;

  @Property({ nullable: true })
  firstLoginAt?: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions = new Collection<Session>(this);

  @OneToMany(() => Account, (account) => account.user)
  accounts = new Collection<Account>(this);

  @OneToMany(() => Member, (member) => member.user)
  memberships = new Collection<Member>(this);
}
