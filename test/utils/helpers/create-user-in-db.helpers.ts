import type { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

import { hashPassword } from "better-auth/crypto";

import { Account } from "@/common/entities/accounts.entity";
import { User } from "@/common/entities/users.entity";
import { EUserState } from "@/common/enums/users.enums";

export const MOCK_USER_EMAIL = "test@example.com";
export const MOCK_USER_PASSWORD = "password123";

export const createUserInDb = async (
  dbService: EntityManager<IDatabaseDriver<Connection>>,
  config?: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    state?: EUserState;
    emailVerified?: boolean;
  },
  shouldFlush = true,
) => {
  const defaultConfig = {
    email: MOCK_USER_EMAIL,
    password: MOCK_USER_PASSWORD,
    firstName: "Test",
    lastName: "User",
    state: EUserState.ACTIVE,
    emailVerified: true,
  };

  const values = {
    ...defaultConfig,
    ...config,
  };

  const hashedPassword = await hashPassword(values.password);

  const user = dbService.create(User, {
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    name: `${values.firstName} ${values.lastName}`,
    state: values.state,
    emailVerified: values.emailVerified,
  });

  dbService.persist(user);
  await dbService.flush();

  const account = dbService.create(Account, {
    user,
    accountId: user.id,
    providerId: "credential",
    password: hashedPassword,
  });

  dbService.persist(account);

  if (shouldFlush) {
    await dbService.flush();
  }

  return user;
};
