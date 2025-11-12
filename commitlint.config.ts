import type { UserConfig } from "@commitlint/types";
import { RuleConfigSeverity } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "scope-must-be-ticket-number": ({ scope }) => {
          const pattern = /^[A-Z]{2,5}-[0-9]+$/;
          if (!scope) return [false, "scope is required"];
          return [pattern.test(scope), `scope must match pattern ${pattern}`];
        },
      },
    },
  ],
  rules: {
    "scope-empty": [RuleConfigSeverity.Error, "never"],
    "scope-must-be-ticket-number": [RuleConfigSeverity.Error, "always"],
    "type-case": [RuleConfigSeverity.Error, "always", "lower-case"],
    "subject-empty": [RuleConfigSeverity.Error, "never"],
    "header-max-length": [RuleConfigSeverity.Error, "always", 100],
  },
};

export default Configuration;
