import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate from vite.config.js so test settings never affect production
// builds. API tests run in Node; component tests opt into jsdom with a
// `// @vitest-environment jsdom` comment at the top of the file.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.{js,jsx}"],
    environment: "node",
    setupFiles: ["tests/setup.js"],
    restoreMocks: true,   // vi.spyOn mocks reset between tests
    unstubGlobals: true,  // vi.stubGlobal (fetch, etc.) undone between tests
    unstubEnvs: true,     // vi.stubEnv undone between tests
  },
});
