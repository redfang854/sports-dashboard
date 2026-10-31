import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Unmount anything a component test rendered. Imported lazily so the
// Node-environment API tests don't need a DOM.
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
