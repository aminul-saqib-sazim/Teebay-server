import { PartialType } from "@nestjs/mapped-types";

import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

import { EProductCategory, EProductListingType, ERentOption } from "@/common/enums/products.enums";

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
  rentalPrice!: number;

  @IsEnum(ERentOption)
  @IsOptional()
  rentOption?: ERentOption;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsArray()
  @IsEnum(EProductCategory, { each: true })
  categories!: EProductCategory[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) { }

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

  @IsEnum(EProductListingType)
  @IsOptional()
  @Type(() => String)
  listingType?: EProductListingType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;
}
export class OrderProductDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number = 1;
}
