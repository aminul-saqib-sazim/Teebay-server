import { Test, TestingModule } from "@nestjs/testing";

import { AuthController } from "@/modules/auth/auth.controller";
import { AuthService } from "@/modules/auth/auth.service";
import { UsersService } from "@/modules/users/users.service";

import { MOCK_JWT_TOKEN, getMockSignInResponse } from "./auth.mocks";
import { MOCK_USER } from "./users.mocks";

describe("AuthController", () => {
  let controller: AuthController;

  const mockAuthService = {
    createAccessToken: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should sign in a user", async () => {
    mockAuthService.createAccessToken.mockResolvedValue(MOCK_JWT_TOKEN);

    const response = await controller.signIn(MOCK_USER);
    expect(mockAuthService.createAccessToken).toHaveBeenCalledWith(MOCK_USER);
    expect(response).toEqual(getMockSignInResponse(MOCK_USER));
  });
});
