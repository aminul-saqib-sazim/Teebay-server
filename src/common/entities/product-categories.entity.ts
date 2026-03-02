import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

import { ProductCategoryRepository } from "@/modules/products/product-category.repository";

import { CustomBaseEntity } from "./custom-base.entity";

@Entity({ tableName: "product_categories", repository: () => ProductCategoryRepository })
export class ProductCategory extends CustomBaseEntity {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Property({ unique: true })
  name!: string;
}
