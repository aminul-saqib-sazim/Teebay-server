import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import { hashPassword } from "better-auth/crypto";

import { Account } from "@/common/entities/accounts.entity";
import { Member } from "@/common/entities/members.entity";
import { Organization } from "@/common/entities/organizations.entity";
import { ProductCategory } from "@/common/entities/product-categories.entity";
import { User } from "@/common/entities/users.entity";
import { EProductCategory } from "@/common/enums/products.enums";
import { EUserRole } from "@/common/enums/roles.enums";
import { EUserState } from "@/common/enums/users.enums";

export class DevDatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const ownerEmail = process.env.ORGANIZATION_OWNER_EMAIL || "owner@sazim.io";
    const ownerPassword = process.env.ORGANIZATION_OWNER_PASSWORD || "Password123";

    const existingUser = await em.findOne(User, { email: ownerEmail });
    if (existingUser) {
      console.log(`Owner user ${ownerEmail} already exists, skipping seed.`);
      return;
    }

    const hashedPassword = await hashPassword(ownerPassword);

    const user = em.create(User, {
      email: ownerEmail,
      emailVerified: true,
      firstName: "Organization",
      lastName: "Owner",
      name: "Organization Owner",
      state: EUserState.ACTIVE,
    });

    const account = em.create(Account, {
      user,
      accountId: ownerEmail,
      providerId: "credential",
      password: hashedPassword,
    });

    const organization = em.create(Organization, {
      name: "Default Organization",
      slug: "default-organization",
    });

    const membership = em.create(Member, {
      user,
      organization,
      role: EUserRole.OWNER,
    });

    await em.persistAndFlush([user, account, organization, membership]);

    // Seed product categories
    const existingCategories = await em.find(ProductCategory, {});
    if (existingCategories.length === 0) {
      const categories = Object.values(EProductCategory).map((category) =>
        em.create(ProductCategory, {
          name: category
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        }),
      );

      await em.persistAndFlush(categories);
      console.log("Product categories seeded successfully");
    } else {
      console.log("Product categories already exist, skipping seed");
    }
  }
}
