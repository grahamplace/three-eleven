import { createMany } from "@/store/service-request";
import {
  getLatestUpdatedDatetime,
  setLatestUpdatedDatetime,
} from "@/store/metadata";
import { ServiceRequest } from "@/entities";
import { envobj, string } from "envobj";
import sfdataClient, { ResourceId } from "@/lib/sfdata";
import { fromSfWallClock, toSfWallClock } from "@/lib/time";

const env = envobj(
  {
    ENV: string,
  },
  process.env as Record<string, string | undefined>,
  {
    ENV: "development",
  },
);

// 50k is maximum allowed by SODA 2.1
// 10k causes issues with Postgres bulk insert parameter limits
const BATCH_SIZE = 1000;
const DELAY_MS = 500;

// It takes ~1.5s per batch. 20 batches is ~30s. Vercel free plan has max timeout limit of 60s. In dev, can run more batches per run.
const MAX_BATCHES_PER_RUN = env.ENV === "development" ? 1000 : 20;

// Type for raw API response from SF 311 data. All datetimes are Socrata
// floating timestamps: Pacific wall-clock strings with no zone.
type RawServiceRequestData = {
  service_request_id: string;
  requested_datetime: string;
  closed_date: string | null;
  updated_datetime: string | null;
  status_description: string | null;
  status_notes: string | null;
  agency_responsible: string | null;
  service_name: string | null;
  service_subtype: string | null;
  service_details: string | null;
  address: string | null;
  street: string | null;
  supervisor_district: string | null;
  neighborhoods_sffind_boundaries: string | null;
  analysis_neighborhood: string | null;
  police_district: string | null;
  source: string | null;
  data_as_of: string | null;
  data_loaded_at: string | null;
  lat: string | null;
  long: string | null;
  media_url: { url: string } | null;
};

async function fetchDataChunk(
  offset: number,
  latestUpdatedDatetime: Date,
): Promise<RawServiceRequestData[]> {
  // SODA compares floating timestamps as Pacific wall-clock, so format the
  // watermark the same way rather than as UTC.
  const formattedDate = toSfWallClock(latestUpdatedDatetime);

  const result = await sfdataClient
    .query(ResourceId.SERVICE_REQUESTS)
    .where("updated_datetime", ">", formattedDate)
    .orderBy("updated_datetime", "asc")
    .limit(BATCH_SIZE)
    .offset(offset)
    .execute<RawServiceRequestData>();

  return result.data;
}

export type IngestOptions = {
  /** Upper bound on batches per run; the default fits a serverless timeout. */
  maxBatches?: number;
  /** Pause between SODA pages, to stay clear of rate limits. */
  delayMs?: number;
};

export type IngestSummary = {
  totalProcessed: number;
  batches: number;
  /** True when the run stopped at maxBatches with more rows still upstream. */
  hitBatchCap: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function ingestServiceRequests({
  maxBatches = MAX_BATCHES_PER_RUN,
  delayMs = DELAY_MS,
}: IngestOptions = {}): Promise<IngestSummary> {
  // Pagination is by offset, so the watermark must stay fixed across pages.
  const latestUpdatedDatetime = await getLatestUpdatedDatetime();
  let batches = 0;
  let offset = 0;
  let totalProcessed = 0;
  let hitBatchCap = false;

  for (;;) {
    if (batches >= maxBatches) {
      hitBatchCap = true;
      break;
    }

    console.info(
      `Fetching batch ${batches + 1} at offset ${offset} (updated after ${toSfWallClock(latestUpdatedDatetime)})`,
    );
    const rawData = await fetchDataChunk(offset, latestUpdatedDatetime);
    if (rawData.length === 0) {
      break;
    }

    await createMany(transformData(rawData));
    totalProcessed += rawData.length;
    batches++;
    offset += BATCH_SIZE;
    console.info(`Processed ${totalProcessed} records so far`);

    if (rawData.length < BATCH_SIZE) {
      break; // short page: nothing left upstream
    }
    if (delayMs > 0) await sleep(delayMs);
  }

  // Advance the watermark to the newest row we now hold. Rows we did not reach
  // this run have a later updated_datetime and are picked up next run.
  await setLatestUpdatedDatetime();

  if (hitBatchCap) {
    console.warn(
      `Ingest stopped at the ${maxBatches}-batch cap with more rows upstream; ` +
        `the next run resumes from the new watermark. If this happens every run, ingestion is falling behind.`,
    );
  }
  console.info(
    `Ingest complete: ${totalProcessed} records in ${batches} batches${hitBatchCap ? " (cap reached)" : ""}`,
  );

  return { totalProcessed, batches, hitBatchCap };
}

export function transformData(
  rawData: RawServiceRequestData[],
): Omit<ServiceRequest, "created_at" | "updated_at">[] {
  return rawData.map((item) => ({
    service_request_id: item.service_request_id,
    requested_datetime: fromSfWallClock(item.requested_datetime),
    closed_date: item.closed_date ? fromSfWallClock(item.closed_date) : null,
    updated_datetime: item.updated_datetime
      ? fromSfWallClock(item.updated_datetime)
      : null,
    status_description: item.status_description || null,
    status_notes: item.status_notes || null,
    agency_responsible: item.agency_responsible || null,
    service_name: item.service_name || null,
    service_subtype: item.service_subtype || null,
    service_details: item.service_details || null,
    address: item.address || null,
    street: item.street || null,
    supervisor_district: item.supervisor_district
      ? parseFloat(item.supervisor_district)
      : null,
    neighborhoods_sffind_boundaries:
      item.neighborhoods_sffind_boundaries || null,
    analysis_neighborhood: item.analysis_neighborhood || null,
    police_district: item.police_district || null,
    source: item.source || null,
    data_as_of: item.data_as_of ? fromSfWallClock(item.data_as_of) : null,
    data_loaded_at: item.data_loaded_at
      ? fromSfWallClock(item.data_loaded_at)
      : null,
    lat: item.lat ? parseFloat(item.lat) : null,
    long: item.long ? parseFloat(item.long) : null,
    media_url: item.media_url?.url || null,
  }));
}
