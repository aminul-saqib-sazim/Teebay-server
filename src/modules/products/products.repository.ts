import type { FilterQuery } from "@mikro-orm/core";

import { Product } from "@/common/entities/products.entity";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

import { IGetProductsDto } from "./products.dtos";

export class ProductsRepository extends CustomSQLBaseRepository<Product> {
  async findAllPaginated(
    options: IGetProductsDto,
  ): Promise<{ products: Product[]; total: number }> {
    const { page, limit, search, category } = options;
    const offset = (page - 1) * limit;

    const where: FilterQuery<Product> = {};

    if (search) {
      where.$or = [{ title: { $like: `%${search}%` } }, { description: { $like: `%${search}%` } }];
    }

    if (category) {
      where.categories = { $contains: [category] };
    }

    const [products, total] = await this.em.findAndCount(Product, where, {
      limit,
      offset,
      orderBy: { createdAt: "DESC" },
      populate: ["owner"],
    });

    return { products, total };
  }
}
