import { HttpStatus } from "@nestjs/common";

import request from "supertest";

import type { bootstrapTestServer } from "../bootstrap";
import { MOCK_USER_EMAIL, MOCK_USER_PASSWORD } from "./create-user-in-db.helpers";

export async function getBearerToken(
  httpServer: Awaited<ReturnType<typeof bootstrapTestServer>>["httpServerInstance"],
  email = MOCK_USER_EMAIL,
  password = MOCK_USER_PASSWORD,
) {
  const response = await request(httpServer)
    .post("/auth/sign-in/email")
    .send({ email, password })
    .expect(HttpStatus.OK);

  const token = response.body?.token;
  if (!token) {
    throw new Error("No bearer token returned from sign-in");
  }

  return token;
}
