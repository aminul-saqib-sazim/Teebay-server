import { HttpStatus, INestApplication } from "@nestjs/common";

import type { IDatabaseDriver, Connection, EntityManager, MikroORM } from "@mikro-orm/core";

import request from "supertest";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";
import { THttpServer } from "../utils/types";
import { seedPermissionsData } from "./auth.helpers";
import { MOCK_AUTH_EMAIL, MOCK_AUTH_PASS } from "./auth.mock";

describe("Authentication (e2e)", () => {
  let app: INestApplication;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let httpServer: THttpServer;
  let orm: MikroORM<IDatabaseDriver<Connection>>;

  beforeAll(async () => {
    const { appInstance, dbServiceInstance, httpServerInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    dbService = dbServiceInstance;
    httpServer = httpServerInstance;
    orm = ormInstance;
    await seedPermissionsData(dbService);
  });

  afterAll(async () => {
    await truncateTables(dbService);
    await orm.close();
    await httpServer.close();
    await app.close();
  });

  describe("Authentication", () => {
    beforeAll(async () => {
      await createUserInDb(dbService);
    });

    describe("POST /auth/login", () => {
      it("should return 201 Created with proper credentials", () =>
        request(httpServer)
          .post("/auth/login")
          .send(`email=${MOCK_AUTH_EMAIL}&password=${MOCK_AUTH_PASS}`)
          .expect(HttpStatus.CREATED)
          .expect(({ body }) => {
            expect(body.data.user.email).toEqual(MOCK_AUTH_EMAIL);
            expect(body.data).toHaveProperty("accessToken");
            expect(body.data.user.password).toBeUndefined();
          }));

      it("should return 401 Unauthorized with wrong credentials", () =>
        request(httpServer)
          .post("/auth/login")
          .send(`email=${MOCK_AUTH_EMAIL}&password=wrongpassword`)
          .expect(HttpStatus.UNAUTHORIZED));

      it("Without authentication params, gets back 401 Unauthenticated", () =>
        request(httpServer).post("/auth/login").expect(HttpStatus.UNAUTHORIZED));
    });
  });
});
