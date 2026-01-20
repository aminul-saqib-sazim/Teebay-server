import { PartialType } from "@nestjs/mapped-types";

import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";

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

export class UpdateProductDto extends PartialType(CreateProductDto) { }