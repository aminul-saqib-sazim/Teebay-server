import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { EUserRole } from "@/common/enums/roles.enums";
import { EPermission } from "@/modules/permissions/permissions.enums";

import { PermissionsGuard } from "../permissions.guard";

describe("PermissionsGuard", () => {
  let guard: PermissionsGuard;
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

    guard = new PermissionsGuard(mockReflector as unknown as Reflector);
  });

  describe("canActivate", () => {
    it("should return true when no permissions are required", () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when no active organization", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.READ] });
      mockRequest.session = {
        session: {
          activeOrganizationId: undefined,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow("No active organization found");
    });

    it("should throw ForbiddenException when user has no role", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.READ] });
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

    it("should throw ForbiddenException for unknown role", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.READ] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: "unknown-role",
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow("Unknown role");
    });

    it("should return true when owner has all permissions", () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        user: [EPermission.READ, EPermission.CREATE, EPermission.UPDATE, EPermission.DELETE],
      });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.OWNER,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should return true when admin has READ permission on user", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.READ] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.ADMIN,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should return true when member has READ permission on user", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.READ] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when member tries to CREATE user", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.CREATE] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        "does not have 'create' permission",
      );
    });

    it("should throw ForbiddenException when member tries to UPDATE user", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.UPDATE] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException when admin tries to DELETE user", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ user: [EPermission.DELETE] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.ADMIN,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException when role does not have access to resource", () => {
      // Member role doesn't have any permissions on 'role' resource
      mockReflector.getAllAndOverride.mockReturnValue({ role: [EPermission.READ] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.MEMBER,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        "does not have access to resource",
      );
    });

    it("should return true when owner has UPDATE permission on role", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ role: [EPermission.UPDATE] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.OWNER,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when admin tries to UPDATE role", () => {
      mockReflector.getAllAndOverride.mockReturnValue({ role: [EPermission.UPDATE] });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.ADMIN,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it("should check multiple resources and permissions", () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        user: [EPermission.READ, EPermission.UPDATE],
        role: [EPermission.READ],
      });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.OWNER,
        },
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("should fail if any required permission is missing", () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        user: [EPermission.READ],
        role: [EPermission.UPDATE], // Admin doesn't have UPDATE on role
      });
      mockRequest.session = {
        session: {
          activeOrganizationId: "org-123",
          activeOrganizationRole: EUserRole.ADMIN,
        },
      };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });
  });
});
