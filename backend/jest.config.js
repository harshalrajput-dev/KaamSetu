import { fileURLToPath } from "node:url";

export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  testTimeout: 60000,
};
