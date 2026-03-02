import { Controller, Get, UseGuards, Req, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import type { Request } from "express";

import { User } from "@/common/entities/users.entity";
import { PermissionsGuard } from "@/common/guards/permissions.guard";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";

import { OrdersService } from "./orders.service";

@ApiTags("Orders")
@Controller("orders")
@UseInterceptors(ResponseTransformInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("my-orders")
  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  getMyOrders(@Req() req: Request) {
    return this.ordersService.getMyOrders(req.user as User);
  }

  @Get("my-sales")
  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  getMySales(@Req() req: Request) {
    return this.ordersService.getMySales(req.user as User);
  }
}
