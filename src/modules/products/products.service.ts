import { Injectable } from "@nestjs/common";

import { User } from "@/common/entities/users.entity";

import { CreateProductDto } from "./products.dtos";
import { ProductsRepository } from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) { }

  async create(user: User, createProductDto: CreateProductDto) {
    const em = this.productsRepository.getEntityManager();
    const ownerRef = em.getReference(User, user.id);

    const product = this.productsRepository.create({
      ...createProductDto,
      owner: ownerRef,
    });
    await em.persistAndFlush(product);
    return product;
  }
}
