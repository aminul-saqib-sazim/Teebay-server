import { UnauthorizedException } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";

import { getCorsConfig } from "@/common/config/cors.config";
import { AbstractWebsocketGateway } from "@/common/websockets/abstract-websocket.gateway";
import type { TSocket } from "@/common/websockets/abstract-websocket.types";
import { AuthService } from "@/modules/auth/auth.service";

import { EGatewayIncomingEvent, EGatewayOutgoingEvent } from "./websocket-example.enum";

@WebSocketGateway(Number(process.env.BE_WS_PORT), {
  cors: getCorsConfig(),
  path: "/ws-example",
  transports: ["websocket"],
})
export class WebsocketExampleGateway extends AbstractWebsocketGateway {
  constructor(private readonly authService: AuthService) {
    super();
  }

  private userIdToSocketMap: Map<string, TSocket> = new Map();

  onModuleInit(): void {
    super.onModuleInit();

    this.server.use(async (socket: TSocket, next) => {
      try {
        const headers = new Headers();

        // Get cookies from handshake headers or auth
        const cookieHeader = socket.handshake.headers.cookie || socket.handshake.auth?.cookie;

        if (cookieHeader) {
          headers.set("cookie", cookieHeader);
        }

        // Copy other relevant headers
        Object.entries(socket.handshake.headers).forEach(([key, value]) => {
          if (value && key !== "cookie") {
            headers.set(key, Array.isArray(value) ? value[0] : value);
          }
        });

        const session = await this.authService.auth.api.getSession({ headers });

        if (!session) {
          return next(new UnauthorizedException());
        }

        socket.userId = session.user.id;
        return next();
      } catch {
        return next(new UnauthorizedException());
      }
    });
  }

  processNewConnection(socket: TSocket): void {
    const userId = socket.userId;

    if (userId) {
      this.userIdToSocketMap.set(userId, socket);
    }
  }

  emitPayloadToRoom<TPayload>(room: string, event: string, payload: TPayload): void {
    this.server.to(room).emit(event, payload);
  }

  emitPayloadForEvent<TPayload>(event: string, payload: TPayload): void {
    this.server.emit(event, payload);
  }

  @SubscribeMessage(EGatewayIncomingEvent.PING)
  handlePing(@MessageBody() payload: string): void {
    this.emitPayloadForEvent(EGatewayOutgoingEvent.PONG, payload);
  }
}
