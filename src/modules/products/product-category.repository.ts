import { ProductCategory } from "@/common/entities/product-categories.entity";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

export class ProductCategoryRepository extends CustomSQLBaseRepository<ProductCategory> {}
