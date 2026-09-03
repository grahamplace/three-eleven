import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { findPoints, findPointsByQueryId } from "@/store/service-request";
import { parseDateRangeParams } from "@/lib/api/params";
import {
  CACHE_CONTROL,
  SERVICE_REQUESTS_TAG,
  type ApiError,
  type PointsResponse,
  type PointTuple,
} from "@/lib/api/types";

// Five decimals is ~1m precision, plenty for a city map, and trims payload.
const round = (n: number) => Math.round(n * 1e5) / 1e5;

const getPoints = unstable_cache(
  async (start: string, end: string, query: string | null) => {
    const rows = query
      ? await findPointsByQueryId(query, start, end)
      : await findPoints(start, end);
    // The query filters null coordinates, but pgtyped can't see that.
    return rows.flatMap((r): PointTuple[] =>
      r.long != null && r.lat != null
        ? [[r.service_request_id, round(r.long), round(r.lat)]]
        : [],
    );
  },
  ["points"],
  { revalidate: 3600, tags: [SERVICE_REQUESTS_TAG] },
);

export async function GET(request: NextRequest) {
  const parsed = parseDateRangeParams(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json<ApiError>(
      { error: parsed.error },
      { status: 400 },
    );
  }
  const { start, end, query } = parsed.value;

  const points = await getPoints(start, end, query);

  return NextResponse.json<PointsResponse>(
    { points },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
