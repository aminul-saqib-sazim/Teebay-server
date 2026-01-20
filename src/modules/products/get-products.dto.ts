import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

import { EProductCategory } from "@/common/enums/products.enums";

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
