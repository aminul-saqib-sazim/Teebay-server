import type { STATEMENT } from "./permissions.constants";

export type TPermission = Partial<{
  [K in keyof typeof STATEMENT]: (typeof STATEMENT)[K][number][];
}>;
