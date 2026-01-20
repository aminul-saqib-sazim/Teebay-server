import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["**/*.spec.ts", "!**/*.int.spec.ts"],
    env: {
      // vitest overrides this for some reason: https://github.com/vitest-dev/vitest/discussions/5695
      BASE_URL: process.env["BASE_URL"] ?? "/",
    },
  },
  plugins: [swc.vite(), tsconfigPaths()],
});
