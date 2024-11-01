import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

import { ITokenizedUser } from "@/auth/auth.interfaces";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { User } from "@/common/entities/users.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { RoleResponse } from "@/roles/roles.dtos";

export class UserProfileDto implements Pick<UserProfile, "firstName" | "lastName"> {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  lastName!: string;
}

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

export class UserResponse {
  id!: number;
  email!: string;
  createdAt!: string;
  updatedAt!: string;
  userProfile!: UserProfileResponse;
}

export class UserProfileResponse {
  id!: number;
  createdAt!: string;
  updatedAt!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  role!: RoleResponse;
}

export class TokenizedUser implements ITokenizedUser {
  id!: number;

  claimId!: number;

  @ApiProperty({ enum: EUserRole, enumName: "EUserRole" })
  claim!: EUserRole;

  userProfileId!: number;

  email!: string;
}
