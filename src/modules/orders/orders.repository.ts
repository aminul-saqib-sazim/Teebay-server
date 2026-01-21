import { Order } from "@/common/entities/orders.entity";
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
}
