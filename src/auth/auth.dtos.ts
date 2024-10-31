import { TokenizedUser } from "@/users/users.dtos";

export class SignInResponse {
  accessToken!: string;
  user!: TokenizedUser;
}
