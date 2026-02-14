import { PartialType } from "@nestjs/mapped-types";

import { Type } from "class-transformer";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

import { Product } from "@/common/entities/products.entity";
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
@ValidatorConstraint({ name: "rentDateRange", async: false })
class RentDateRangeValidator implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const { rentStartDate, rentEndDate } = args.object as {
      rentStartDate?: string;
      rentEndDate?: string;
    };
    if (!rentStartDate || !rentEndDate) return true;
    const start = new Date(rentStartDate);
    const end = new Date(rentEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return start >= today && end >= start;
  }

  defaultMessage() {
    return "Rent start must be today or later, and end must be on or after start.";
  }
}

export class OrderProductDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number = 1;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => o.rentEndDate)
  @Transform(({ value }) => (value ? new Date(value).toISOString().split("T")[0] : undefined))
  rentStartDate?: string;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => o.rentStartDate)
  @Transform(({ value }) => (value ? new Date(value).toISOString().split("T")[0] : undefined))
  rentEndDate?: string;

  @ValidateIf((o) => o.rentStartDate || o.rentEndDate)
  @Validate(RentDateRangeValidator)
  _validateDateRange?: unknown;
}

export interface IPaginatedProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
