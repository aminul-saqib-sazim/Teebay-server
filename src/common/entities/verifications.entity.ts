import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

import { CustomBaseEntity } from "./custom-base.entity";

@Entity({ tableName: "verifications" })
export class Verification extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Property()
  identifier!: string;

  @Property()
  value!: string;

  @Property()
  expiresAt!: Date;
}
