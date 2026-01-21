import { Module } from "@nestjs/common";

import { MikroOrmModule } from "@mikro-orm/nestjs";

import { Product } from "@/common/entities/products.entity";
import { OrdersModule } from "@/modules/orders/orders.module";

import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [MikroOrmModule.forFeature([Product]), OrdersModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
