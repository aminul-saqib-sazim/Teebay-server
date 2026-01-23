import type { FilterQuery } from "@mikro-orm/core";

import { Product } from "@/common/entities/products.entity";
import { EProductListingType } from "@/common/enums/products.enums";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

import { IGetProductsDto } from "./products.dtos";

export class ProductsRepository extends CustomSQLBaseRepository<Product> {
  async findAllPaginated(
    options: IGetProductsDto,
  ): Promise<{ products: Product[]; total: number }> {
    const { page, limit, search, category, listingType, minPrice, maxPrice } = options;
    const offset = (page - 1) * limit;

    const where: FilterQuery<Product> = {};

    if (search) {
      where.$or = [{ title: { $like: `%${search}%` } }, { description: { $like: `%${search}%` } }];
    }

    if (category) {
      where.categories = { $contains: [category] };
    }

    const priceRange: { $gte?: number; $lte?: number } = {};

    if (minPrice !== undefined) {
      priceRange.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      priceRange.$lte = maxPrice;
    }

    if (listingType) {
      where.rentOption = listingType === EProductListingType.RENT ? { $ne: null } : { $eq: null };

      if (Object.keys(priceRange).length > 0) {
        if (listingType === EProductListingType.BUY) {
          where.price = priceRange;
        } else {
          where.rentalPrice = priceRange;
        }
      }
    } else if (Object.keys(priceRange).length > 0) {
      where.$or = [
        ...(where.$or ? (where.$or as FilterQuery<Product>[]) : []),
        { price: priceRange },
        { rentalPrice: priceRange },
      ];
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
