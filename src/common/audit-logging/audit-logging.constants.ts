import { ChangeSetType } from "@mikro-orm/core";

export const CHANGE_SET_TYPES_TO_PROCESS = [
  ChangeSetType.CREATE,
  ChangeSetType.UPDATE,
  ChangeSetType.DELETE,
];
