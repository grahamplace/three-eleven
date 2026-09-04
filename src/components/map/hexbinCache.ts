import type { HexbinsResponse } from "@/lib/api/types";

/**
 * Cross-reload cache for hexbin payloads, in the browser's Cache Storage.
 *
 * Every resolution is prefetched once per date range (see useMapData), which
 * is a few hundred KB — too much for localStorage's 5MB synchronous string
 * store, and a natural fit for Cache Storage, which holds Responses, is async
 * and is measured in hundreds of MB.
 *
 * Entries are keyed by request URL inside a cache named for the ingest the
 * data came from, so a nightly ingest lands in a fresh cache and the previous
 * one is dropped whole rather than serving yesterday's counts. Absent in
 * insecure contexts and older browsers, where every call no-ops and the
 * network path takes over.
 */
const PREFIX = "hexbins-";

let open: { version: string; cache: Promise<Cache | null> } | null = null;

function cacheFor(version: string): Promise<Cache | null> {
  if (typeof caches === "undefined") return Promise.resolve(null);
  if (open?.version === version) return open.cache;

  const name = `${PREFIX}${version}`;
  const cache = caches
    .keys()
    .then(async (names) => {
      await Promise.all(
        names
          .filter((n) => n.startsWith(PREFIX) && n !== name)
          .map((n) => caches.delete(n)),
      );
      return caches.open(name);
    })
    .catch(() => null);

  open = { version, cache };
  return cache;
}

export async function readCachedHexbins(
  url: string,
  version: string,
): Promise<HexbinsResponse | null> {
  try {
    const cache = await cacheFor(version);
    const hit = await cache?.match(url);
    return hit ? ((await hit.json()) as HexbinsResponse) : null;
  } catch {
    return null;
  }
}

export async function writeCachedHexbins(
  url: string,
  version: string,
  response: Response,
): Promise<void> {
  try {
    const cache = await cacheFor(version);
    await cache?.put(url, response);
  } catch {
    // A full or unavailable cache is not worth surfacing: the network path
    // already produced the data on screen.
  }
}

/** Test seam: forgets the memoized cache handle. */
export function resetHexbinCache() {
  open = null;
}
