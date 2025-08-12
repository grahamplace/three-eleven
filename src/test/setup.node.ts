import { beforeAll, afterAll, afterEach, vi } from "vitest";

// MSW setup will be handled in individual test files as needed

// Mock React for Node environment
vi.mock("react", () => ({
  default: {
    createElement: vi.fn(),
    Fragment: Symbol("Fragment"),
  },
  createElement: vi.fn(),
  Fragment: Symbol("Fragment"),
}));

// Mock React Testing Library for Node environment
vi.mock("@testing-library/react", () => ({
  render: vi.fn(),
  screen: {
    getByTestId: vi.fn(),
    getByText: vi.fn(),
  },
  fireEvent: {
    click: vi.fn(),
  },
  waitFor: vi.fn(),
}));

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
