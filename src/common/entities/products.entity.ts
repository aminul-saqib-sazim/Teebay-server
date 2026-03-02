import { Entity, Enum, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";

import { EProductCategory, ERentOption } from "@/common/enums/products.enums";
import { ProductsRepository } from "@/modules/products/products.repository";

import { CustomBaseEntity } from "./custom-base.entity";
import { User } from "./users.entity";

@Entity({ tableName: "products", repository: () => ProductsRepository })
export class Product extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Property()
  title!: string;

  @Property({ type: "text" })
  description!: string;

  @Property({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Property({ type: "decimal", precision: 10, scale: 2 })
  rentalPrice!: number;

  @Enum({ items: () => ERentOption, nullable: true })
  rentOption?: ERentOption;

  @Property()
  quantity!: number;

  @Enum({ items: () => EProductCategory, array: true })
  categories!: EProductCategory[];

  @ManyToOne(() => User)
  owner!: User;
}
