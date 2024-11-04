import { Injectable } from "@nestjs/common";

import { EntityRepository } from "@mikro-orm/postgresql";

import { Role } from "@/common/entities/roles.entity";

@Injectable()
export class RolesRepository extends EntityRepository<Role> {}
