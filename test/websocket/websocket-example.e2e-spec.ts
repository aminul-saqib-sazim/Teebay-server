import type { INestApplication } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection, MikroORM } from "@mikro-orm/core";

import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type { DoneCallback } from "vitest";

import {
  EGatewayIncomingEvent,
  EGatewayOutgoingEvent,
} from "@/modules/websocket-example/websocket-example.enum";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getBearerToken } from "../utils/helpers/bearer-token.helpers";
import {
  createUserInDb,
  MOCK_USER_EMAIL,
  MOCK_USER_PASSWORD,
} from "../utils/helpers/create-user-in-db.helpers";
import type { THttpServer } from "../utils/types";

describe("Websocket Example Gateway (E2E)", () => {
  let app: INestApplication;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let httpServer: THttpServer;
  let orm: MikroORM<IDatabaseDriver<Connection>>;
  let socket: Socket;

  let bearerToken: string;

  const defaultSocketConnectConfig = {
    autoConnect: false,
    path: "/ws-example",
    transports: ["websocket"],
  };
  const defaultSocketUrl = `ws://localhost:${process.env.BE_WS_PORT}`;

  beforeAll(async () => {
    const { appInstance, dbServiceInstance, httpServerInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    dbService = dbServiceInstance;
    httpServer = httpServerInstance;
    orm = ormInstance;

    await truncateTables(dbService);
    dbService.clear();

    await createUserInDb(dbService);

    bearerToken = await getBearerToken(httpServer, MOCK_USER_EMAIL, MOCK_USER_PASSWORD);
  });

  afterAll(async () => {
    await truncateTables(dbService);
    await orm.close();
    await httpServer.close();
    await app.close();
  });

  afterEach(() => {
    dbService.clear();
    if (socket) {
      socket.disconnect();
    }
  });

  describe("unauthenticated user", () => {
    it("unauthenticated users cannot connect", (done: DoneCallback) => {
      socket = io(defaultSocketUrl, {
        ...defaultSocketConnectConfig,
        auth: {
          token: "invalid-token",
        },
        extraHeaders: {
          authorization: "Bearer invalid-token",
        },
      });

      socket.on("connect_error", (error) => {
        expect(error.message).toBe("Unauthorized");
        done();
      });

      socket.connect();
    });
  });

  describe("authenticated user", () => {
    it("authenticated users can connect", (done: DoneCallback) => {
      socket = io(defaultSocketUrl, {
        ...defaultSocketConnectConfig,
        auth: {
          token: bearerToken,
        },
        extraHeaders: {
          authorization: `Bearer ${bearerToken}`,
        },
      });

      socket.on("connect", () => {
        expect(socket.connected).toBe(true);
        done();
      });

      socket.connect();
    });
  });

  describe("ping event", () => {
    it("responds to ping event", (done: DoneCallback) => {
      socket = io(defaultSocketUrl, {
        ...defaultSocketConnectConfig,
        auth: {
          token: bearerToken,
        },
        extraHeaders: {
          authorization: `Bearer ${bearerToken}`,
        },
      });

      socket.on("connect", () => {
        socket.emit(EGatewayIncomingEvent.PING, { data: "ping" });
        socket.on(EGatewayOutgoingEvent.PONG, (payload) => {
          expect(payload).toEqual({ data: "ping" });
          done();
        });
      });

      socket.connect();
    });
  });
});
