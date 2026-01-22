import { PartialType } from "@nestjs/mapped-types";

import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

import { EProductCategory } from "@/common/enums/products.enums";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsArray()
  @IsEnum(EProductCategory, { each: true })
  categories!: EProductCategory[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class IGetProductsDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(EProductCategory)
  @IsOptional()
  @Type(() => String)
  category?: EProductCategory;
}
export class OrderProductDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number = 1;
}
