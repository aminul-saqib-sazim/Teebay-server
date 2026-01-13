import { Injectable } from "@nestjs/common";

import type { IBetterAuthInstance } from "./auth.interfaces";

@Injectable()
export class AuthService {
  private authInstance: IBetterAuthInstance | null = null;

  /**
   * Set the auth instance. Called by AuthModule during initialization.
   */
  setAuth(auth: IBetterAuthInstance) {
    this.authInstance = auth;
  }

  get auth(): IBetterAuthInstance {
    if (!this.authInstance) {
      throw new Error("Auth instance not initialized");
    }
    return this.authInstance;
  }
}
