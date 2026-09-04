import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  readCachedHexbins,
  writeCachedHexbins,
  resetHexbinCache,
} from "@/components/map/hexbinCache";

/** Minimal stand-in for the browser's Cache Storage. */
class FakeCache {
  entries = new Map<string, Response>();
  async match(url: string) {
    return this.entries.get(url);
  }
  async put(url: string, response: Response) {
    this.entries.set(url, response);
  }
}

const stores = new Map<string, FakeCache>();

const fakeCaches = {
  open: vi.fn(async (name: string) => {
    let store = stores.get(name);
    if (!store) stores.set(name, (store = new FakeCache()));
    return store;
  }),
  keys: vi.fn(async () => [...stores.keys()]),
  delete: vi.fn(async (name: string) => stores.delete(name)),
};

const payload = { resolution: 9, cells: [["89283082803ffff", 4]] };
const url = "/api/hexbins?start=2024-01-01&end=2024-01-07&res=9";

beforeEach(() => {
  stores.clear();
  resetHexbinCache();
  vi.stubGlobal("caches", fakeCaches);
});

afterEach(() => vi.unstubAllGlobals());

describe("hexbinCache", () => {
  it("returns null for a url it has never stored", async () => {
    expect(await readCachedHexbins(url, "v1")).toBeNull();
  });

  it("reads back what it stored, keyed by url", async () => {
    await writeCachedHexbins(url, "v1", Response.json(payload));

    expect(await readCachedHexbins(url, "v1")).toEqual(payload);
    expect(await readCachedHexbins(`${url}&query=graffiti`, "v1")).toBeNull();
  });

  it("drops the previous ingest's cache when the data version changes", async () => {
    await writeCachedHexbins(url, "v1", Response.json(payload));
    resetHexbinCache(); // as if the page reloaded after a nightly ingest

    expect(await readCachedHexbins(url, "v2")).toBeNull();
    expect([...stores.keys()]).toEqual(["hexbins-v2"]);
  });

  it("leaves caches it does not own alone", async () => {
    stores.set("some-other-app-cache", new FakeCache());

    await writeCachedHexbins(url, "v1", Response.json(payload));

    expect([...stores.keys()]).toContain("some-other-app-cache");
  });

  it("no-ops where Cache Storage is unavailable", async () => {
    vi.stubGlobal("caches", undefined);
    resetHexbinCache();

    await expect(
      writeCachedHexbins(url, "v1", Response.json(payload)),
    ).resolves.toBeUndefined();
    expect(await readCachedHexbins(url, "v1")).toBeNull();
  });

  it("survives a cache that throws", async () => {
    vi.stubGlobal("caches", {
      ...fakeCaches,
      keys: vi.fn(async () => {
        throw new Error("QuotaExceeded");
      }),
    });
    resetHexbinCache();

    await expect(
      writeCachedHexbins(url, "v1", Response.json(payload)),
    ).resolves.toBeUndefined();
    expect(await readCachedHexbins(url, "v1")).toBeNull();
  });
});
