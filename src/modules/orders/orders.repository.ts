import { Order } from "@/common/entities/orders.entity";
import { CustomSQLBaseRepository } from "@/common/repository/custom-sql-base.repository";

export class OrdersRepository extends CustomSQLBaseRepository<Order> { }
