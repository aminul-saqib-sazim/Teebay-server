import { Product } from "@/common/entities/products.entity";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

export class ProductsRepository extends CustomSQLBaseRepository<Product> { }
