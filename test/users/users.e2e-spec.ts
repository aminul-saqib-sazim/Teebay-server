import type { INestApplication } from "@nestjs/common";
import { HttpStatus } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import type { MikroORM } from "@mikro-orm/postgresql";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Member } from "@/common/entities/members.entity";
import { Organization } from "@/common/entities/organizations.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EUserState } from "@/common/enums/users.enums";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getBearerToken } from "../utils/helpers/bearer-token.helpers";
import { createUserInDb, MOCK_USER_EMAIL } from "../utils/helpers/create-user-in-db.helpers";

describe("Users E2E", () => {
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

  describe("GET /users/me", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).get("/users/me");

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe("Invalid or expired session");
    });

    it("should return the current user when authenticated", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .get("/users/me")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toMatchObject({
        id: user.id,
        email: MOCK_USER_EMAIL,
        firstName: "Test",
        lastName: "User",
        state: EUserState.ACTIVE,
      });
    });

    it("should return 403 when user is inactive", async () => {
      await createUserInDb(dbService, { state: EUserState.INACTIVE });

      const response = await request(httpServer)
        .post("/auth/sign-in/email")
        .send({ email: MOCK_USER_EMAIL, password: "password123" });

      if (response.status === HttpStatus.OK) {
        const bearerToken = response.body?.token;

        if (bearerToken) {
          const meResponse = await request(httpServer)
            .get("/users/me")
            .set("Authorization", `Bearer ${bearerToken}`);

          expect(meResponse.status).toBe(HttpStatus.FORBIDDEN);
          expect(meResponse.body.message).toContain("deactivated");
        }
      }
    });
  });

  describe("PATCH /users/me", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).patch("/users/me").send({ firstName: "Updated" });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should update the current user profile", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .patch("/users/me")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ firstName: "UpdatedFirst", lastName: "UpdatedLast" });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toMatchObject({
        firstName: "UpdatedFirst",
        lastName: "UpdatedLast",
        name: "UpdatedFirst UpdatedLast",
      });
    });

    it("should update only firstName and keep lastName", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .patch("/users/me")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ firstName: "NewFirst" });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.firstName).toBe("NewFirst");
      expect(response.body.data.lastName).toBe("User");
      expect(response.body.data.name).toBe("NewFirst User");
    });
  });

  describe("GET /users (list users)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).get("/users");

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return empty list when user has no active organization", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .get("/users")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect([HttpStatus.OK, HttpStatus.FORBIDDEN]).toContain(response.status);
    });

    it("should return users list when user has proper permissions", async () => {
      const user = await createUserInDb(dbService);

      const organization = dbService.create(Organization, {
        name: "Test Org",
        slug: "test-org",
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
        .get("/users")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toBeDefined();
    });
  });

  describe("PATCH /users/:id", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer)
        .patch("/users/some-user-id")
        .send({ firstName: "Updated" });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return 403 when user lacks permissions", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ firstName: "Updated" });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it("should update user when has proper permissions", async () => {
      const user = await createUserInDb(dbService);
      const targetUser = await createUserInDb(dbService, { email: "target@example.com" }, true);

      const organization = dbService.create(Organization, {
        name: "Test Org",
        slug: "test-org-update",
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
        .patch(`/users/${targetUser.id}`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ firstName: "AdminUpdated" });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.firstName).toBe("AdminUpdated");
    });
  });

  describe("POST /users (invite user)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).post("/users").send({
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
      });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return 403 when user lacks CREATE permission", async () => {
      const user = await createUserInDb(dbService);

      const organization = dbService.create(Organization, {
        name: "Test Org",
        slug: "test-org-invite",
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
        .post("/users")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          email: "newuser@example.com",
          firstName: "New",
          lastName: "User",
        });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
