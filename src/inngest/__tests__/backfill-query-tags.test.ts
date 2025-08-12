import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database connection to prevent process.exit
vi.mock("@/lib/db", () => ({
  db: {
    query: vi.fn(),
  },
}));

// Mock the store functions
vi.mock("@/store/service-request-query-tags", () => ({
  createQueryTagsForMany: vi.fn(),
}));

describe("Inngest backfill functions", () => {
  let weeklyBackfillScheduler: any;
  let processBatchFunction: any;
  let mockStep: any;

  beforeEach(async () => {
    // Import the functions after mocking
    const module = await import("@/inngest/functions/backfill-query-tags");
    weeklyBackfillScheduler = module.weeklyBackfillScheduler;
    processBatchFunction = module.processBatchFunction;

    // Set up mock step
    mockStep = {
      run: vi.fn((name, fn) => {
        if (name === "count-service-requests") {
          return Promise.resolve(5000);
        }
        if (name === "fetch-batch") {
          return Promise.resolve([{ service_request_id: "test-1" }]);
        }
        if (name === "process-batch") {
          return Promise.resolve(1);
        }
        return Promise.resolve();
      }),
      sendEvent: vi.fn(),
      logger: {
        info: vi.fn(),
      },
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("weeklyBackfillScheduler", () => {
    it("should count service requests and trigger first batch", async () => {
      // Mock the count query
      const { db } = await import("@/lib/db");
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ count: "5000" }],
      });

      const result = await weeklyBackfillScheduler.fn({
        step: mockStep,
        event: { name: "test" },
        logger: mockStep.logger,
      } as any);

      expect(mockStep.run).toHaveBeenCalledWith(
        "count-service-requests",
        expect.any(Function)
      );
      expect(mockStep.sendEvent).toHaveBeenCalledWith("trigger-first-batch", {
        name: "query-tags.process-batch",
        data: {
          batchNumber: 1,
          totalBatches: 2,
          batchSize: 2500,
        },
      });
      expect(result).toEqual({
        totalRequests: 5000,
        totalBatches: 2,
        message: "Backfill process initiated",
      });
    });

    it("should handle empty database", async () => {
      // Override the mock for this test to return 0
      mockStep.run = vi.fn((name, fn) => {
        if (name === "count-service-requests") {
          return Promise.resolve(0);
        }
        return Promise.resolve();
      });

      const result = await weeklyBackfillScheduler.fn({
        step: mockStep,
        event: { name: "test" },
        logger: mockStep.logger,
      } as any);

      expect(mockStep.sendEvent).not.toHaveBeenCalled();
      expect(result).toEqual({
        totalRequests: 0,
        totalBatches: 0,
        message: "No service requests to process",
      });
    });
  });

  describe("processBatchFunction", () => {
    it("should process a batch and trigger next batch", async () => {
      const mockServiceRequests = [
        { service_request_id: "test-1" },
        { service_request_id: "test-2" },
      ];

      // Mock the fetch batch query
      const { db } = await import("@/lib/db");
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: mockServiceRequests,
      });

      // Mock the createQueryTagsForMany function
      const { createQueryTagsForMany } = await import(
        "@/store/service-request-query-tags"
      );
      vi.mocked(createQueryTagsForMany).mockResolvedValueOnce([
        { service_request_id: "test-1", query_id: "poop" },
        { service_request_id: "test-2", query_id: "graffiti" },
      ]);

      const result = await processBatchFunction.fn({
        step: mockStep,
        event: {
          name: "query-tags.process-batch",
          data: {
            batchNumber: 1,
            totalBatches: 3,
            batchSize: 2500,
          },
        },
        logger: mockStep.logger,
      } as any);

      expect(mockStep.run).toHaveBeenCalledWith(
        "fetch-batch",
        expect.any(Function)
      );
      expect(mockStep.run).toHaveBeenCalledWith(
        "process-batch",
        expect.any(Function)
      );
      expect(mockStep.sendEvent).toHaveBeenCalledWith("trigger-next-batch", {
        name: "query-tags.process-batch",
        data: {
          batchNumber: 2,
          totalBatches: 3,
          batchSize: 2500,
        },
      });
      expect(result).toEqual({
        batchNumber: 1,
        processedRequests: 1,
        processedTags: 1,
        status: "completed",
        nextBatch: 2,
      });
    });

    it("should complete when processing last batch", async () => {
      const mockServiceRequests = [{ service_request_id: "test-1" }];

      // Mock the fetch batch query
      const { db } = await import("@/lib/db");
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: mockServiceRequests,
      });

      // Mock the createQueryTagsForMany function
      const { createQueryTagsForMany } = await import(
        "@/store/service-request-query-tags"
      );
      vi.mocked(createQueryTagsForMany).mockResolvedValueOnce([
        { service_request_id: "test-1", query_id: "poop" },
      ]);

      const result = await processBatchFunction.fn({
        step: mockStep,
        event: {
          name: "query-tags.process-batch",
          data: {
            batchNumber: 2,
            totalBatches: 2,
            batchSize: 2500,
          },
        },
        logger: mockStep.logger,
      } as any);

      expect(mockStep.sendEvent).not.toHaveBeenCalled();
      expect(result).toEqual({
        batchNumber: 2,
        processedRequests: 1,
        processedTags: 1,
        status: "completed",
        nextBatch: null,
        message: "Backfill process completed",
      });
    });

    it("should handle empty batch", async () => {
      // Mock empty batch
      const { db } = await import("@/lib/db");
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [],
      });

      const result = await processBatchFunction.fn({
        step: mockStep,
        event: {
          name: "query-tags.process-batch",
          data: {
            batchNumber: 1,
            totalBatches: 2,
            batchSize: 2500,
          },
        },
        logger: mockStep.logger,
      } as any);

      expect(result).toEqual({
        batchNumber: 1,
        processedRequests: 1,
        processedTags: 1,
        status: "completed",
        nextBatch: 2,
      });
    });
  });
});
