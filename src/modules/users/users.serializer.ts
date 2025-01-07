import { Injectable } from "@nestjs/common";

import { AbstractBaseSerializer } from "@/common/serializers";
import { TSerializationOptions } from "@/common/serializers/abstract-base-serializer.types";

@Injectable()
export class UsersSerializer extends AbstractBaseSerializer {
  protected serializeOneOptions: TSerializationOptions = {
    skipNull: true,
    forceObject: true,
    exclude: [
      "password",
      "userProfile.role.permissions",
      "verificationRequests",
      "state",
      "createdBy",
      "updatedBy",
    ],
    populate: ["userProfile.role"],
  };

  protected serializeManyOptions: TSerializationOptions = {
    skipNull: true,
    forceObject: true,
    exclude: [
      "password",
      "userProfile.role.permissions",
      "verificationRequests",
      "createdBy",
      "updatedBy",
    ],
    populate: ["userProfile.role"],
  };
}
