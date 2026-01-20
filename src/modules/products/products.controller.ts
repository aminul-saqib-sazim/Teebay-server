import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { Request } from "express";

import { Permissions } from "@/common/decorators/auth/permissions.decorator";
import { User } from "@/common/entities/users.entity";
import { PermissionsGuard } from "@/common/guards/permissions.guard";

import { EPermission } from "../permissions/permissions.enums";
import { CreateProductDto, UpdateProductDto } from "./products.dtos";
import { ProductsService } from "./products.service";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseGuards(PermissionsGuard)
  create(@Req() req: Request, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(req.user as User, createProductDto);
  }

  @Patch(":id")
  @UseGuards(PermissionsGuard)
  @Permissions({ user: [EPermission.UPDATE] })
  update(@Req() req: Request, @Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, req.user as User, updateProductDto);
  }
}
