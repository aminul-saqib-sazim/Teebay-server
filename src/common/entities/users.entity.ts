import { Entity, EntityRepositoryType, OneToOne, PrimaryKey, Property, Rel } from "@mikro-orm/core";

import { UsersRepository } from "@/modules/users/users.repository";

import { CustomBaseEntity } from "./custom-base.entity";
import { UserProfile } from "./user-profiles.entity";

@Entity({
  tableName: "users",
  repository: () => UsersRepository,
})
export class User extends CustomBaseEntity {
  [EntityRepositoryType]?: UsersRepository;

  constructor(email: string, password?: string) {
    super();

    this.email = email;
    this.password = password;
  }

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  password?: string | null;

  @OneToOne(() => UserProfile, { mappedBy: (userProfile) => userProfile.user })
  userProfile!: Rel<UserProfile>;
}
