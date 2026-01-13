import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { WebSocketServer } from "@nestjs/websockets";

import { Server } from "socket.io";

import type { TSocket } from "./abstract-websocket.types";

@Injectable()
export abstract class AbstractWebsocketGateway implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer() protected readonly server!: Server;

  onModuleInit() {
    this.server.on("connection", (socket) => this.processNewConnection(socket));
  }

  onModuleDestroy() {
    this.server.close();
  }

  abstract processNewConnection(socket: TSocket): void;

  abstract emitPayloadToRoom<TPayload>(room: string, event: string, payload: TPayload): void;

  abstract emitPayloadForEvent<TPayload>(event: string, payload: TPayload): void;
}
