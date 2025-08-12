import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

// Set up MSW server for API mocking
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Environment shims for testing
// Note: NODE_ENV is typically set by the test runner, so we don't override it
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://test:test@localhost:5432/test_db";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});
