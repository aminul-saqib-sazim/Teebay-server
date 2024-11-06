import { PartialType, PickType } from "@nestjs/mapped-types";
import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

import { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EUserState } from "@/common/enums/users.enums";
import { ITokenizedUser } from "@/modules/auth/auth.interfaces";

import { UserProfileDto, UserProfileResponse } from "../user-profiles/user-profiles.dtos";

export class RegisterUserDto implements Pick<User, "email" | "password"> {
  @IsString()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string = process.env.DEFAULT_PASSWORD as string;

  @IsObject()
  @ValidateNested()
  @Type(() => UserProfileDto)
  profileInput!: UserProfileDto;
}

export class UpdateUserDto extends PickType(PartialType(RegisterUserDto), [
  "password",
  "profileInput",
]) {
  @IsOptional()
  @IsEnum(EUserState)
  @ApiProperty({ enum: EUserState, enumName: "EUserState", required: false })
  state?: EUserState;
}

export class UserResponse {
  id!: number;
  email!: string;
  createdAt!: string;
  updatedAt!: string;
  userProfile!: UserProfileResponse;
}

export class TokenizedUser implements ITokenizedUser {
  id!: number;

  claimId!: number;

  @ApiProperty({ enum: EUserRole, enumName: "EUserRole" })
  claim!: EUserRole;

  userProfileId!: number;

  email!: string;
}
