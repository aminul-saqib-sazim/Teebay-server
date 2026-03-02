import type { FilterQuery } from "@mikro-orm/core";

import { Order } from "@/common/entities/orders.entity";
import { EOrderType } from "@/common/enums/orders.enums";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

export class OrdersRepository extends CustomSQLBaseRepository<Order> {
  async findByBuyerId(buyerId: string): Promise<Order[]> {
    const orders = await this.find(
      { buyer: { id: buyerId } },
      {
        populate: ["product", "product.owner", "buyer"],
        orderBy: { createdAt: "DESC" },
      },
    );
    return orders;
  }

  async findBySellerId(sellerId: string): Promise<Order[]> {
    const orders = await this.find(
      { product: { owner: { id: sellerId } } },
      {
        populate: ["product", "product.owner", "buyer"],
        orderBy: { createdAt: "DESC" },
      },
    );
    return orders;
  }

  async findOverlappingRentals(
    productId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Order[]> {
    const where: FilterQuery<Order> = {
      product: { id: productId },
      type: EOrderType.RENT,
      $or: [
        {
          rentStartDate: { $lte: endDate },
          rentEndDate: { $gte: startDate },
        },
        {
          rentStartDate: { $gte: startDate, $lte: endDate },
        },
        {
          rentEndDate: { $gte: startDate, $lte: endDate },
        },
      ],
    };

    const overLappingRents = await this.find(where, {
      populate: ["product"],
    });

    return overLappingRents;
  }
}
