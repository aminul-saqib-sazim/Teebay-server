import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["**/*.int.spec.ts", "**/*.e2e-spec.ts"],
    env: {
      // vitest overrides this for some reason: https://github.com/vitest-dev/vitest/discussions/5695
      BASE_URL: process.env["BASE_URL"] ?? "/",
    },
    isolate: false,
    fileParallelism: false,
    disableConsoleIntercept: true,
  },
  resolve: {
    alias: {
      "@/test/": new URL("./test/", import.meta.url).pathname,
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
  plugins: [swc.vite()],
});
