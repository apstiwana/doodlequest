// Shared entry point for Playwright specs. Re-exported here (rather than
// importing @playwright/test directly in every spec) so that fixtures can be
// added in one place later without touching each test file.
export { test, expect } from "@playwright/test";
