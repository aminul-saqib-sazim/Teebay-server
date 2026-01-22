import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { Request } from "express";

import { Permissions } from "@/common/decorators/auth/permissions.decorator";
import { User } from "@/common/entities/users.entity";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { EPermission } from "../permissions/permissions.enums";
import {
  CreateProductDto,
  IGetProductsDto,
  OrderProductDto,
  UpdateProductDto,
} from "./products.dtos";
import { ProductsService } from "./products.service";

@ApiTags("Products")
@Controller("products")
@UseInterceptors(ResponseTransformInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @Permissions({ product: [EPermission.CREATE] })
  create(@Req() req: Request, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(req.user as User, createProductDto);
  }

  @Patch(":id")
  @Permissions({ product: [EPermission.UPDATE] })
  update(@Req() req: Request, @Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, req.user as User, updateProductDto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    return this.productsService.remove(id, req.user as User);
  }

  @Get()
  findAll(@Query() query: IGetProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Post(":id/buy")
  buy(@Req() req: Request, @Param("id") id: string, @Body() orderProductDto: OrderProductDto) {
    return this.productsService.buyProduct(id, req.user as User, orderProductDto.quantity);
  }

  @Post(":id/rent")
  rent(@Req() req: Request, @Param("id") id: string, @Body() orderProductDto: OrderProductDto) {
    return this.productsService.rentProduct(id, req.user as User, orderProductDto.quantity);
  }
}
