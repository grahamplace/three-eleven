import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = {
  isOpen: false,
  on: vi.fn(),
  connect: vi.fn(async () => {
    mockClient.isOpen = true;
  }),
  quit: vi.fn(async () => {
    mockClient.isOpen = false;
  }),
};

const createClient = vi.fn(() => mockClient);

vi.mock("redis", () => ({ createClient }));

describe("lib/redis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockClient.isOpen = false;
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.ENV = "test";
  });

  it("does not connect at import time", async () => {
    await import("@/lib/redis");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates one client and reuses it across calls", async () => {
    const { getRedisClient } = await import("@/lib/redis");

    const a = await getRedisClient();
    const b = await getRedisClient();

    expect(a).toBe(b);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockClient.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("deduplicates concurrent connection attempts", async () => {
    const { getRedisClient } = await import("@/lib/redis");

    await Promise.all([getRedisClient(), getRedisClient(), getRedisClient()]);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockClient.connect).toHaveBeenCalledTimes(1);
  });

  it("closeRedis quits the client and a new one is created afterwards", async () => {
    const { getRedisClient, closeRedis } = await import("@/lib/redis");

    await getRedisClient();
    await closeRedis();
    await closeRedis(); // idempotent
    await getRedisClient();

    expect(mockClient.quit).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledTimes(2);
  });

  it("prefixes keys with the environment", async () => {
    const { prefixKey } = await import("@/lib/redis");
    expect(prefixKey("foo")).toBe("test:foo");
  });
});
