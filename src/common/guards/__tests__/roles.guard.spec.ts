import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { EUserRole } from "@/common/enums/roles.enums";

import { RolesGuard } from "../roles.guard";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let mockExecutionContext: ExecutionContext;
  let mockRequest: {
    session?: { session: { activeOrganizationId?: string; activeOrganizationRole?: string } };
  };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };

    mockRequest = {};

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    guard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  describe("canActivate", () => {
    it("should return true when no roles are required", () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should return true when roles array is empty", () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when no active organization", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER]);
      mockRequest.session = {
        session: {
          activeOrganizationId: undefined,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow("No active organization found");
    });

    it("should throw ForbiddenException when user has no role", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: undefined,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        "User has no role in the organization",
      );
    });

    it("should return true when user has the required role", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.OWNER,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should return true when user has one of multiple required roles", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER, EUserRole.ADMIN]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.ADMIN,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when user does not have required role", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow("is not authorized");
    });

    it("should throw ForbiddenException when member tries to access owner-only route", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException when admin tries to access owner-only route", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.ADMIN,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it("should return true when admin accesses admin-or-owner route", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER, EUserRole.ADMIN]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.ADMIN,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should include required roles in error message", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER, EUserRole.ADMIN]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(/Required roles: owner, admin/);
    });

    it("should handle session without activeOrganizationId gracefully", () => {
      mockReflector.getAllAndOverride.mockReturnValue([EUserRole.OWNER]);
      mockRequest.session = undefined;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it("should allow all roles when any role is accepted", () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        EUserRole.OWNER,
        EUserRole.ADMIN,
        EUserRole.MEMBER,
      ]);
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
