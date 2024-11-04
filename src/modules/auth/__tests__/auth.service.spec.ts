import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";

import { AuthService } from "@/modules/auth/auth.service";
import { RolesService } from "@/modules/roles/roles.service";
import { UsersService } from "@/modules/users/users.service";

import { MOCK_JWT_TOKEN, MOCK_USER_PASSWORD } from "./auth.mocks";
import { MOCK_USER } from "./users.mocks";

describe("AuthService", () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: vi.fn(),
  };

  const mockUsersService = {
    findByEmailOrThrow: vi.fn(),
  };

  const rolesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RolesService,
          useValue: rolesService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should validate an user", async () => {
    mockUsersService.findByEmailOrThrow.mockResolvedValue(MOCK_USER);

    const response = await service.validateUser(MOCK_USER.email, MOCK_USER_PASSWORD);
    expect(response).toEqual(MOCK_USER);
  });

  it("should return access token", async () => {
    mockUsersService.findByEmailOrThrow.mockResolvedValue(MOCK_USER);
    mockJwtService.signAsync.mockResolvedValue(MOCK_JWT_TOKEN);

    const response = await service.createAccessToken(MOCK_USER);
    expect(response).toEqual(MOCK_JWT_TOKEN);
  });
});
