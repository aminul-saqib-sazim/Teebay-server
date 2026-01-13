import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import type { EntityManager } from "@mikro-orm/core";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { EUserState } from "@/common/enums/users.enums";
import type { AuthService } from "@/modules/auth/auth.service";

import { SessionGuard } from "../session.guard";

describe("SessionGuard", () => {
  let guard: SessionGuard;
  let mockAuthService: { auth: { api: { getSession: ReturnType<typeof vi.fn> } } };
  let mockEntityManager: { findOne: ReturnType<typeof vi.fn> };
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let mockExecutionContext: ExecutionContext;
  let mockRequest: { headers: Record<string, string> };

  beforeEach(() => {
    mockAuthService = {
      auth: {
        api: {
          getSession: vi.fn(),
        },
      },
    };

    mockEntityManager = {
      findOne: vi.fn(),
    };

    mockReflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };

    mockRequest = {
      headers: {
        cookie: "test-session-cookie",
      },
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    guard = new SessionGuard(
      mockAuthService as unknown as AuthService,
      mockEntityManager as unknown as EntityManager,
      mockReflector as unknown as Reflector,
    );
  });

  describe("canActivate", () => {
    it("should throw UnauthorizedException when no session is found", async () => {
      mockAuthService.auth.api.getSession.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when getSession throws an error", async () => {
      mockAuthService.auth.api.getSession.mockRejectedValue(new Error("Session error"));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        "Invalid or expired session",
      );
    });

    it("should throw ForbiddenException when user state is INACTIVE", async () => {
      mockAuthService.auth.api.getSession.mockResolvedValue({
        user: {
          id: "user-123",
          state: EUserState.INACTIVE,
        },
        session: {
          activeOrganizationId: null,
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        "Your account has been deactivated",
      );
    });

    it("should return true and attach session to request for active user", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          state: EUserState.ACTIVE,
        },
        session: {
          activeOrganizationId: null,
          activeOrganizationRole: null,
        },
      };

      mockAuthService.auth.api.getSession.mockResolvedValue(mockSession);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect((mockRequest as { session?: unknown }).session).toBeDefined();
      expect((mockRequest as { user?: unknown }).user).toEqual(mockSession.user);
    });

    it("should enrich session with organization role when activeOrganizationId exists but no role", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          state: EUserState.ACTIVE,
        },
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: null,
        },
      };

      mockAuthService.auth.api.getSession.mockResolvedValue(mockSession);
      mockEntityManager.findOne.mockResolvedValue({ role: "owner" });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(expect.anything(), {
        user: "user-123",
        organization: "org-123",
      });
      expect(
        (mockRequest as { session?: { session: { activeOrganizationRole?: string } } }).session
          ?.session.activeOrganizationRole,
      ).toBe("owner");
    });

    it("should not query for role when activeOrganizationRole already exists", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          state: EUserState.ACTIVE,
        },
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: "admin",
        },
      };

      mockAuthService.auth.api.getSession.mockResolvedValue(mockSession);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockEntityManager.findOne).not.toHaveBeenCalled();
    });

    it("should not set role when member is not found", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          state: EUserState.ACTIVE,
        },
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: null,
        },
      };

      mockAuthService.auth.api.getSession.mockResolvedValue(mockSession);
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(
        (mockRequest as { session?: { session: { activeOrganizationRole?: string | null } } })
          .session?.session.activeOrganizationRole,
      ).toBeNull();
    });

    it("should convert request headers correctly", async () => {
      mockRequest.headers = {
        cookie: "session=abc123",
        "content-type": "application/json",
        authorization: "Bearer token",
      };

      const mockSession = {
        user: {
          id: "user-123",
          state: EUserState.ACTIVE,
        },
        session: {
          activeOrganizationId: null,
        },
      };

      mockAuthService.auth.api.getSession.mockResolvedValue(mockSession);

      await guard.canActivate(mockExecutionContext);

      expect(mockAuthService.auth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
    });

    it("should handle array header values", async () => {
      mockRequest.headers = {
        cookie: "session=abc123",
      };
      (mockRequest.headers as Record<string, string | string[]>)["x-custom"] = ["value1", "value2"];

      const mockSession = {
        user: {
          id: "user-123",
          state: EUserState.ACTIVE,
        },
        session: {
          activeOrganizationId: null,
        },
      };

      mockAuthService.auth.api.getSession.mockResolvedValue(mockSession);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should return true without checking session when route is public", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockAuthService.auth.api.getSession).not.toHaveBeenCalled();
    });
  });
});
