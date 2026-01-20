import { Module } from "@nestjs/common";

import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { Product } from "@/common/entities/products.entity";

import { ProductsController } from "./products.controller";
import { ProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";

@Module({
    imports: [MikroOrmModule.forFeature([Product])],
    controllers: [ProductsController],
    providers: [
        ProductsService,
        {
            provide: ProductsRepository,
            useFactory: (em: EntityManager) => em.getRepository(Product),
            inject: [EntityManager],
        },
    ],
    exports: [ProductsService],
})
export class ProductsModule { }
