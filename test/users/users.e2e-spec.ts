import { HttpStatus, INestApplication } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection, MikroORM } from "@mikro-orm/core";

import { faker } from "@faker-js/faker";
import request from "supertest";

import { Role } from "@/common/entities/roles.entity";
import { UserProfile } from "@/common/entities/user-profiles.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { RegisterUserDto } from "@/modules/users/users.dtos";

import { seedPermissionsData } from "../auth/auth.helpers";
import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getAccessToken } from "../utils/helpers/access-token.helpers";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { THttpServer } from "../utils/types";

describe("UsersController (e2e)", () => {
  let app: INestApplication;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let httpServer: THttpServer;
  let orm: MikroORM<IDatabaseDriver<Connection>>;

  let superAdminRole: Role;
  let adminRole: Role;

  beforeAll(async () => {
    const { appInstance, dbServiceInstance, httpServerInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    dbService = dbServiceInstance;
    httpServer = httpServerInstance;
    orm = ormInstance;
    await seedPermissionsData(dbService);

    superAdminRole = await dbService.findOneOrFail(
      Role,
      { name: EUserRole.SUPER_USER },
      { disableIdentityMap: true },
    );
    adminRole = await dbService.findOneOrFail(
      Role,
      { name: EUserRole.ADMIN },
      { disableIdentityMap: true },
    );
  });

  afterAll(async () => {
    await truncateTables(dbService);
    await orm.close();
    await httpServer.close();
    await app.close();
  });

  afterEach(() => {
    dbService.clear();
  });

  describe("GET /users/me", () => {
    const testUserEmail = faker.internet.email();
    const testUserPassword = faker.internet.password();

    let token: string;
    let userProfile: UserProfile;

    beforeAll(async () => {
      userProfile = await createUserInDb(dbService, {
        email: testUserEmail,
        password: testUserPassword,
      });

      token = await getAccessToken(httpServer, testUserEmail, testUserPassword);
    });

    it("returns OK(200) with user data", () =>
      request(httpServer)
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.data).toEqual({
            id: expect.any(Number),
            email: testUserEmail,
            claim: userProfile.role.name,
            claimId: userProfile.role.id,
            userProfileId: userProfile.id,
          });
        }));

    it("returns UNAUTHORIZED(401) if user is not authenticated", () =>
      request(httpServer).get("/users/me").expect(HttpStatus.UNAUTHORIZED));
  });

  describe("POST /users", () => {
    const testUserEmail = faker.internet.email();
    const testUserPassword = faker.internet.password();

    let token: string;

    beforeAll(async () => {
      await createUserInDb(dbService, {
        email: testUserEmail,
        password: testUserPassword,
        role: EUserRole.SUPER_USER,
      });

      token = await getAccessToken(httpServer, testUserEmail, testUserPassword);
    });

    it("returns CREATED(201) after creating a new user", () => {
      const newUserRegistrationDto: RegisterUserDto = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        userProfile: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          roleId: adminRole.id,
        },
      };

      return request(httpServer)
        .post("/users")
        .set("Authorization", `Bearer ${token}`)
        .send(newUserRegistrationDto)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body.data).toEqual({
            id: expect.any(Number),
            email: newUserRegistrationDto.email,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            userProfile: {
              id: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              firstName: newUserRegistrationDto.userProfile.firstName,
              lastName: newUserRegistrationDto.userProfile.lastName,
              email: newUserRegistrationDto.email,
              role: {
                id: expect.any(Number),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                name: EUserRole.ADMIN,
              },
            },
          });
        });
    });

    it("returns BAD_REQUEST(400) if user already exists", () => {
      const newUserRegistrationDto: RegisterUserDto = {
        email: testUserEmail,
        password: testUserPassword,
        userProfile: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          roleId: superAdminRole.id,
        },
      };

      return request(httpServer)
        .post("/users")
        .set("Authorization", `Bearer ${token}`)
        .send(newUserRegistrationDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("returns BAD_REQUEST(400) if dto is invalid", () => {
      const newUserRegistrationDto: RegisterUserDto = {
        email: "invalid-email",
        password: "short",
        userProfile: {
          firstName: "",
          lastName: "",
          roleId: superAdminRole.id,
        },
      };

      return request(httpServer)
        .post("/users")
        .set("Authorization", `Bearer ${token}`)
        .send(newUserRegistrationDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toEqual([
            "email must be an email",
            "password must be longer than or equal to 8 characters",
            "userProfile.firstName must be longer than or equal to 2 characters",
            "userProfile.lastName must be longer than or equal to 2 characters",
          ]);
        });
    });
  });
});
