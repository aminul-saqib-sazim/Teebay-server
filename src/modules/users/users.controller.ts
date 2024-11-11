import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  Param,
  ParseIntPipe,
  Query,
} from "@nestjs/common";

import { EUserRole } from "@/common/enums/roles.enums";
import { ResponseTransformInterceptor } from "@/common/interceptors/response-transform.interceptor";
import { ITokenizedUser } from "@/modules/auth/auth.interfaces";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { Roles } from "@/modules/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/modules/auth/guards/roles.guard";

import {
  RegisterUserDto,
  TokenizedUser,
  UserResponse,
  UpdateUserAsSuperuserDto,
  SuperuserFindAllUserResponse,
  SuperuserFindAllUsersParams,
} from "./users.dtos";
import { UsersSerializer } from "./users.serializer";
import { UsersService } from "./users.service";

@UseInterceptors(ResponseTransformInterceptor)
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersSerializer: UsersSerializer,
  ) {}

  @Get("me")
  me(@CurrentUser() user: ITokenizedUser): TokenizedUser {
    return user;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(EUserRole.SUPER_USER)
  async createUser(@Body() registerUserDto: RegisterUserDto): Promise<UserResponse> {
    const newUser = await this.usersService.createOne(registerUserDto);
    return this.usersSerializer.serialize(newUser);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(EUserRole.SUPER_USER)
  async updateUser(
    @Param("id", ParseIntPipe) userId: number,
    @Body() updateUserAsSuperuserDto: UpdateUserAsSuperuserDto,
  ): Promise<UserResponse> {
    const updatedUser = await this.usersService.updateUserAsSuperuser(
      userId,
      updateUserAsSuperuserDto,
    );
    return this.usersSerializer.serialize(updatedUser);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(EUserRole.SUPER_USER)
  async findAllUsers(
    @CurrentUser() user: ITokenizedUser,
    @Query() params: SuperuserFindAllUsersParams,
  ): Promise<SuperuserFindAllUserResponse> {
    const { data, meta } = await this.usersService.findAll(params, user.id);
    return {
      data: this.usersSerializer.serializeMany(data),
      meta,
    };
  }
}
