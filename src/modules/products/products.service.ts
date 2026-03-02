import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { Product } from "@/common/entities/products.entity";
import { User } from "@/common/entities/users.entity";
import { EOrderStatus, EOrderType } from "@/common/enums/orders.enums";
import { OrdersRepository } from "@/modules/orders/orders.repository";

import { CreateProductDto, IGetProductsDto, UpdateProductDto } from "./products.dtos";
import { ProductsRepository } from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly ordersRepository: OrdersRepository,
  ) {}

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

  async remove(id: string, user: User) {
    const product = await this.findOne(id);

    if (user.id !== product.owner.id && !this.isAdmin(user)) {
      throw new ForbiddenException("You are not allowed to delete this product");
    }

    await this.productsRepository.getEntityManager().removeAndFlush(product);
    return { success: true };
  }

  findAll(options: IGetProductsDto): Promise<{ products: Product[]; total: number }> {
    return this.productsRepository.findAllPaginated(options);
  }

  async buyProduct(id: string, user: User) {
    const product = await this.findOne(id);

    if (user.id === product.owner.id) {
      throw new BadRequestException("You cannot buy your own product");
    }

    if (product.quantity < 1) {
      throw new BadRequestException("Product out of stock");
    }

    const em = this.productsRepository.getEntityManager();

    // Create order record
    const order = this.ordersRepository.create({
      product: em.getReference(Product, product.id),
      buyer: em.getReference(User, user.id),
      type: EOrderType.BUY,
      status: EOrderStatus.COMPLETED, // For now it's completed
      price: product.price,
      quantity: 1,
    });

    product.quantity -= 1;

    await em.persistAndFlush([order, product]);

    return { success: true, message: "Product purchased successfully", orderId: order.id };
  }

  async rentProduct(id: string, user: User) {
    const product = await this.findOne(id);

    if (user.id === product.owner.id) {
      throw new BadRequestException("You cannot rent your own product");
    }

    const em = this.productsRepository.getEntityManager();

    // Create rental order record
    const order = this.ordersRepository.create({
      product: em.getReference(Product, product.id),
      buyer: em.getReference(User, user.id),
      type: EOrderType.RENT,
      status: EOrderStatus.COMPLETED,
      price: product.price,
      quantity: 1,
      rentStartDate: new Date(),
    });

    product.quantity -= 1;

    await em.persistAndFlush([order, product]);

    return { success: true, message: "Product rented successfully", orderId: order.id };
  }

  private isAdmin(user: User): boolean {
    console.log(user);
    // TODO: will check user role later
    return false;
  }
}
