import { OmitType, PartialType, PickType } from "@nestjs/mapped-types";
import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

import { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { ITokenizedUser } from "@/modules/auth/auth.interfaces";

import {
  SelfRegisterUserProfileDto,
  UserProfileDto,
  UserProfileResponse,
} from "../user-profiles/user-profiles.dtos";

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
  userProfile!: UserProfileDto;
}

export class SelfRegisterUserDto extends OmitType(RegisterUserDto, ["userProfile"]) {
  @IsObject()
  @ValidateNested()
  @Type(() => SelfRegisterUserProfileDto)
  userProfile!: SelfRegisterUserProfileDto;
}

export class UpdateUserDto extends PickType(PartialType(RegisterUserDto), ["password"]) {}

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
