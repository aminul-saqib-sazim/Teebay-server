import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { User } from "@/common/entities/users.entity";

import { CreateProductDto, UpdateProductDto } from "./products.dtos";
import { ProductsRepository } from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

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

  async update(id: string, user: User, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (user.id !== product.owner.id) {
      throw new ForbiddenException("You are not allowed to update this product");
    }

    this.productsRepository.assign(product, updateProductDto);
    await this.productsRepository.getEntityManager().flush();
    return product;
  }

  async findOne(id: string) {
    const product = await this.productsRepository.findOne({ id }, { populate: ["owner"] });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }
}
