import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { countByH3Cell, countByH3CellForQuery } from "@/store/service-request";
import { parseDateRangeParams, parseResolution } from "@/lib/api/params";
import {
  CACHE_CONTROL,
  SERVICE_REQUESTS_TAG,
  type ApiError,
  type HexbinsResponse,
} from "@/lib/api/types";
import type { H3Resolution } from "@/lib/h3";

const getHexbins = unstable_cache(
  async (
    start: string,
    end: string,
    query: string | null,
    resolution: H3Resolution,
  ) => {
    return query
      ? countByH3CellForQuery(query, resolution, start, end)
      : countByH3Cell(resolution, start, end);
  },
  ["hexbins"],
  { revalidate: 3600, tags: [SERVICE_REQUESTS_TAG] },
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const range = parseDateRangeParams(searchParams);
  if (!range.ok) {
    return NextResponse.json<ApiError>({ error: range.error }, { status: 400 });
  }
  const res = parseResolution(searchParams.get("res"));
  if (!res.ok) {
    return NextResponse.json<ApiError>({ error: res.error }, { status: 400 });
  }

  const { start, end, query } = range.value;
  const cells = await getHexbins(start, end, query, res.value);

  return NextResponse.json<HexbinsResponse>(
    { resolution: res.value, cells },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
