import { Injectable } from "@nestjs/common";

import { User } from "@/common/entities/users.entity";

import { OrdersRepository } from "./orders.repository";

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async getMyOrders(user: User) {
    const orders = await this.ordersRepository.findByBuyerId(user.id);
    return orders;
  }

  async getMySales(user: User) {
    const sales = await this.ordersRepository.findBySellerId(user.id);
    return sales;
  }
}
