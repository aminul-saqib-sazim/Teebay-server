import {
  Controller,
  Post,
  Body,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { Request } from "express";

import { Product } from "@/common/entities/products.entity";
import { User } from "@/common/entities/users.entity";

import { CreateProductDto } from "./dto/create-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  create(@Req() req: Request, @Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(req.user as User, createProductDto);
  }
}
