import { Module } from "@nestjs/common";

import { AuthModule } from "@/modules/auth/auth.module";

import { WebsocketExampleGateway } from "./websocket-example.gateway";

@Module({
  imports: [AuthModule],
  providers: [WebsocketExampleGateway],
})
export class WebsocketExampleModule {}
