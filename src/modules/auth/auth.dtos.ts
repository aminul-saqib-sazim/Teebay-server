import { TokenizedUser } from "@/modules/users/users.dtos";

export class SignInResponse {
  accessToken!: string;
  user!: TokenizedUser;
}
