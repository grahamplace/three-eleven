import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mockPool = {
  query: vi.fn(),
  connect: vi.fn(async () => mockClient),
  on: vi.fn(),
  end: vi.fn(async () => undefined),
};

const PoolCtor = vi.fn(() => mockPool);

const setTypeParser = vi.fn();

vi.mock("pg", () => ({
  default: {
    Pool: PoolCtor,
    types: { builtins: { TIMESTAMP: 1114 }, setTypeParser },
  },
}));

describe("lib/db", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("does not open a pool at import time", async () => {
    await import("@/lib/db");
    expect(PoolCtor).not.toHaveBeenCalled();
  });

  it("parses timestamp columns as Pacific wall-clock time", async () => {
    await import("@/lib/db");

    expect(setTypeParser).toHaveBeenCalledWith(1114, expect.any(Function));
    const parser = setTypeParser.mock.calls[0][1] as (v: string) => Date;
    expect(parser("2024-07-04 12:00:00").toISOString()).toBe(
      "2024-07-04T19:00:00.000Z",
    );
  });

  it("creates a single pool lazily and reuses it", async () => {
    const { db } = await import("@/lib/db");
    mockPool.query.mockResolvedValue({ rows: [{ n: 1 }], rowCount: 1 });

    await db.query("SELECT 1", []);
    await db.query("SELECT 2", []);

    expect(PoolCtor).toHaveBeenCalledTimes(1);
    expect(mockPool.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockPool.query).toHaveBeenCalledTimes(2);
  });

  it("normalizes a null rowCount to 0", async () => {
    const { db } = await import("@/lib/db");
    mockPool.query.mockResolvedValue({ rows: [], rowCount: null });

    const result = await db.query("DELETE FROM x", []);

    expect(result).toEqual({ rows: [], rowCount: 0 });
  });

  describe("withTransaction", () => {
    it("commits and releases on success", async () => {
      const { withTransaction } = await import("@/lib/db");
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await withTransaction(async (tx) => {
        await tx.query("INSERT INTO x VALUES ($1)", [1]);
        return "ok";
      });

      expect(result).toBe("ok");
      const calls = mockClient.query.mock.calls.map((c) => c[0]);
      expect(calls).toEqual(["BEGIN", "INSERT INTO x VALUES ($1)", "COMMIT"]);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("rolls back, releases, and rethrows on failure", async () => {
      const { withTransaction } = await import("@/lib/db");
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const boom = new Error("boom");

      await expect(
        withTransaction(async () => {
          throw boom;
        }),
      ).rejects.toBe(boom);

      const calls = mockClient.query.mock.calls.map((c) => c[0]);
      expect(calls).toEqual(["BEGIN", "ROLLBACK"]);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  it("closeDb ends the pool and allows a fresh one afterwards", async () => {
    const { db, closeDb } = await import("@/lib/db");
    mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

    await db.query("SELECT 1", []);
    await closeDb();
    await closeDb(); // idempotent
    await db.query("SELECT 1", []);

    expect(mockPool.end).toHaveBeenCalledTimes(1);
    expect(PoolCtor).toHaveBeenCalledTimes(2);
  });
});
