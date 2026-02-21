import { Entity, Enum, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";

import { EOrderStatus, EOrderType } from "@/common/enums/orders.enums";
import { OrdersRepository } from "@/modules/orders/orders.repository";

import { CustomBaseEntity } from "./custom-base.entity";
import { Product } from "./products.entity";
import { User } from "./users.entity";

@Entity({ tableName: "orders", repository: () => OrdersRepository })
export class Order extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ManyToOne(() => Product)
  product!: Product;

  @ManyToOne(() => User)
  buyer!: User;

  @Enum({ items: () => EOrderType })
  type!: EOrderType;

  @Enum({ items: () => EOrderStatus, default: EOrderStatus.COMPLETED })
  status!: EOrderStatus;

  @Property({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Property()
  quantity!: number;

  @Property({ nullable: true })
  rentStartDate?: Date;

  @Property({ nullable: true })
  rentEndDate?: Date;
}
