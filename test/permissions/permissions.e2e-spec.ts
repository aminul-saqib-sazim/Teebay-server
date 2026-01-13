import type { INestApplication } from "@nestjs/common";
import { HttpStatus } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import type { MikroORM } from "@mikro-orm/postgresql";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Member } from "@/common/entities/members.entity";
import { Organization } from "@/common/entities/organizations.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EPermission } from "@/modules/permissions/permissions.enums";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getBearerToken } from "../utils/helpers/bearer-token.helpers";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";

describe("Permissions E2E", () => {
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

  describe("POST /permissions/check", () => {
    it("should return 401 when no session cookie is provided", async () => {
      const response = await request(httpServer)
        .post("/permissions/check")
        .send({ permissions: { user: [EPermission.READ] } });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe("Invalid or expired session");
    });

    it("should return hasPermission: false when user has no active organization", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/permissions/check")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ permissions: { user: [EPermission.READ] } });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.hasPermission).toBe(false);
    });

    it("should return 400 when permissions field is missing", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/permissions/check")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({});

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it("should return 400 when permissions is not an object", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/permissions/check")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ permissions: "invalid" });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    describe("OWNER role permissions", () => {
      it("should return hasPermission: true for user CRUD permissions", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Owner",
          slug: "test-org-owner-perms",
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
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              user: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: true for organization UPDATE and DELETE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Owner 2",
          slug: "test-org-owner-perms-2",
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
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              organization: [EPermission.UPDATE, EPermission.DELETE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: true for role READ and UPDATE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Owner 3",
          slug: "test-org-owner-perms-3",
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
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              role: [EPermission.READ, EPermission.UPDATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: true for member CREATE, UPDATE, DELETE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Owner 4",
          slug: "test-org-owner-perms-4",
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
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              member: [EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: true for invitation CREATE and CANCEL", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Owner 5",
          slug: "test-org-owner-perms-5",
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
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              invitation: [EPermission.CREATE, EPermission.CANCEL],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });
    });

    describe("ADMIN role permissions", () => {
      it("should return hasPermission: true for user READ and UPDATE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Admin",
          slug: "test-org-admin-perms",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.ADMIN,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              user: [EPermission.READ, EPermission.UPDATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: false for user CREATE and DELETE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Admin 2",
          slug: "test-org-admin-perms-2",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.ADMIN,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              user: [EPermission.CREATE, EPermission.DELETE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });

      it("should return hasPermission: true for organization UPDATE only", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Admin 3",
          slug: "test-org-admin-perms-3",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.ADMIN,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              organization: [EPermission.UPDATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: false for organization DELETE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Admin 4",
          slug: "test-org-admin-perms-4",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.ADMIN,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              organization: [EPermission.DELETE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });

      it("should return hasPermission: true for role READ only", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Admin 5",
          slug: "test-org-admin-perms-5",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.ADMIN,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              role: [EPermission.READ],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: false for role UPDATE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Admin 6",
          slug: "test-org-admin-perms-6",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.ADMIN,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              role: [EPermission.UPDATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });
    });

    describe("MEMBER role permissions", () => {
      it("should return hasPermission: true for user READ only", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Member",
          slug: "test-org-member-perms",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.MEMBER,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              user: [EPermission.READ],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: false for user CREATE, UPDATE, DELETE", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Member 2",
          slug: "test-org-member-perms-2",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.MEMBER,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              user: [EPermission.CREATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });

      it("should return hasPermission: false for organization permissions", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Member 3",
          slug: "test-org-member-perms-3",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.MEMBER,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              organization: [EPermission.UPDATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });

      it("should return hasPermission: false for member permissions", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Member 4",
          slug: "test-org-member-perms-4",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.MEMBER,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              member: [EPermission.CREATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });

      it("should return hasPermission: false for invitation permissions", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Member 5",
          slug: "test-org-member-perms-5",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.MEMBER,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              invitation: [EPermission.CREATE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });

      it("should return hasPermission: false for role permissions", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Member 6",
          slug: "test-org-member-perms-6",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.MEMBER,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              role: [EPermission.READ],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });
    });

    describe("Multiple permissions check", () => {
      it("should return hasPermission: true when all permissions are satisfied", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Multi",
          slug: "test-org-multi-perms",
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
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              user: [EPermission.READ, EPermission.CREATE],
              organization: [EPermission.UPDATE],
              member: [EPermission.CREATE, EPermission.DELETE],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(true);
      });

      it("should return hasPermission: false when any permission is not satisfied", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Multi 2",
          slug: "test-org-multi-perms-2",
        });
        dbService.persist(organization);

        const member = dbService.create(Member, {
          user,
          organization,
          role: EUserRole.ADMIN,
        });
        dbService.persist(member);
        await dbService.flush();

        const bearerToken = await getBearerToken(httpServer);

        await request(httpServer)
          .post("/auth/organization/set-active")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({ organizationId: organization.id });

        const response = await request(httpServer)
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              user: [EPermission.READ],
              organization: [EPermission.DELETE], // Admin doesn't have DELETE on organization
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });
    });

    describe("Non-existent resource permissions", () => {
      it("should return hasPermission: false for non-existent resource", async () => {
        const user = await createUserInDb(dbService);

        const organization = dbService.create(Organization, {
          name: "Test Org Non-Existent",
          slug: "test-org-non-existent-perms",
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
          .post("/permissions/check")
          .set("Authorization", `Bearer ${bearerToken}`)
          .send({
            permissions: {
              nonExistentResource: [EPermission.READ],
            },
          });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data.hasPermission).toBe(false);
      });
    });
  });
});
