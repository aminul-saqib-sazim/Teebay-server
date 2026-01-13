import { Entity, ManyToOne, PrimaryKey, Property, type Rel } from "@mikro-orm/core";

import { CustomBaseEntity } from "./custom-base.entity";
import { User } from "./users.entity";

@Entity({ tableName: "accounts" })
export class Account extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @Property()
  accountId!: string;

  @Property()
  providerId!: string;

  @Property({ nullable: true, type: "text" })
  accessToken?: string;

  @Property({ nullable: true })
  accessTokenExpiresAt?: Date;

  @Property({ nullable: true, type: "text" })
  refreshToken?: string;

  @Property({ nullable: true })
  refreshTokenExpiresAt?: Date;

  @Property({ nullable: true, type: "text" })
  idToken?: string;

  @Property({ nullable: true })
  expiresAt?: Date;

  @Property({ nullable: true })
  scope?: string;

  @Property({ nullable: true })
  password?: string;
}
