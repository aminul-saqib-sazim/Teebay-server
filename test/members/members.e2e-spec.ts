import type { INestApplication } from "@nestjs/common";
import { HttpStatus } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import type { MikroORM } from "@mikro-orm/postgresql";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Member } from "@/common/entities/members.entity";
import { Organization } from "@/common/entities/organizations.entity";
import { EUserRole } from "@/common/enums/roles.enums";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getBearerToken } from "../utils/helpers/bearer-token.helpers";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";

describe("Members E2E", () => {
  let app: INestApplication;
  let httpServer: ReturnType<INestApplication["getHttpServer"]>;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let orm: MikroORM;

  beforeAll(async () => {
    const { appInstance, httpServerInstance, dbServiceInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    httpServer = httpServerInstance;
    dbService = dbServiceInstance;
    orm = ormInstance;
  });

  afterAll(async () => {
    await orm.close();
    await app.close();
  });

  beforeEach(async () => {
    await truncateTables(dbService);
    dbService.clear();
  });

  describe("PATCH /members (update member role)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer)
        .patch("/members")
        .send({ userId: "some-user-id", role: EUserRole.ADMIN });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe("Invalid or expired session");
    });

    it("should return 403 when user has no active organization", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .patch("/members")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ userId: "some-user-id", role: EUserRole.ADMIN });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe("No active organization found");
    });

    it("should return 403 when user lacks UPDATE permission on role", async () => {
      const user = await createUserInDb(dbService);
      const targetUser = await createUserInDb(dbService, { email: "target@example.com" }, true);

      const organization = dbService.create(Organization, {
        name: "Test Org",
        slug: "test-org-members",
      });
      dbService.persist(organization);

      const member = dbService.create(Member, {
        user,
        organization,
        role: EUserRole.MEMBER,
      });
      dbService.persist(member);

      const targetMember = dbService.create(Member, {
        user: targetUser,
        organization,
        role: EUserRole.MEMBER,
      });
      dbService.persist(targetMember);
      await dbService.flush();

      const bearerToken = await getBearerToken(httpServer);

      await request(httpServer)
        .post("/auth/organization/set-active")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ organizationId: organization.id });

      const response = await request(httpServer)
        .patch("/members")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ userId: targetUser.id, role: EUserRole.ADMIN });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toContain("does not have");
    });

    it("should return 403 when admin tries to update role (no UPDATE permission)", async () => {
      const user = await createUserInDb(dbService);
      const targetUser = await createUserInDb(dbService, { email: "target@example.com" }, true);

      const organization = dbService.create(Organization, {
        name: "Test Org Admin",
        slug: "test-org-admin",
      });
      dbService.persist(organization);

      const member = dbService.create(Member, {
        user,
        organization,
        role: EUserRole.ADMIN,
      });
      dbService.persist(member);

      const targetMember = dbService.create(Member, {
        user: targetUser,
        organization,
        role: EUserRole.MEMBER,
      });
      dbService.persist(targetMember);
      await dbService.flush();

      const bearerToken = await getBearerToken(httpServer);

      await request(httpServer)
        .post("/auth/organization/set-active")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ organizationId: organization.id });

      const response = await request(httpServer)
        .patch("/members")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ userId: targetUser.id, role: EUserRole.ADMIN });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it("should update member role when user is owner", async () => {
      const user = await createUserInDb(dbService);
      const targetUser = await createUserInDb(dbService, { email: "target@example.com" }, true);

      const organization = dbService.create(Organization, {
        name: "Test Org Owner",
        slug: "test-org-owner",
      });
      dbService.persist(organization);

      const member = dbService.create(Member, {
        user,
        organization,
        role: EUserRole.OWNER,
      });
      dbService.persist(member);

      const targetMember = dbService.create(Member, {
        user: targetUser,
        organization,
        role: EUserRole.MEMBER,
      });
      dbService.persist(targetMember);
      await dbService.flush();

      const bearerToken = await getBearerToken(httpServer);

      await request(httpServer)
        .post("/auth/organization/set-active")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ organizationId: organization.id });

      const response = await request(httpServer)
        .patch("/members")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ userId: targetUser.id, role: EUserRole.ADMIN });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.message).toContain("admin");
    });

    it("should return 404 when target user is not a member", async () => {
      const user = await createUserInDb(dbService);
      const nonMemberUser = await createUserInDb(
        dbService,
        { email: "nonmember@example.com" },
        true,
      );

      const organization = dbService.create(Organization, {
        name: "Test Org Non-Member",
        slug: "test-org-nonmember",
      });
      dbService.persist(organization);

      const member = dbService.create(Member, {
        user,
        organization,
        role: EUserRole.OWNER,
      });
      dbService.persist(member);
      await dbService.flush();

      const bearerToken = await getBearerToken(httpServer);

      await request(httpServer)
        .post("/auth/organization/set-active")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ organizationId: organization.id });

      const response = await request(httpServer)
        .patch("/members")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ userId: nonMemberUser.id, role: EUserRole.ADMIN });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(response.body.message).toContain("Member not found");
    });

    it("should validate role enum", async () => {
      const user = await createUserInDb(dbService);

      const organization = dbService.create(Organization, {
        name: "Test Org Validation",
        slug: "test-org-validation",
      });
      dbService.persist(organization);

      const member = dbService.create(Member, {
        user,
        organization,
        role: EUserRole.OWNER,
      });
      dbService.persist(member);
      await dbService.flush();

      const bearerToken = await getBearerToken(httpServer);

      await request(httpServer)
        .post("/auth/organization/set-active")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ organizationId: organization.id });

      const response = await request(httpServer)
        .patch("/members")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ userId: "some-user-id", role: "invalid-role" });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
