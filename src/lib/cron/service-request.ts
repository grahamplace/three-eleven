import { createMany } from "@/store/service-request";
import {
  getLatestUpdatedDatetime,
  setLatestUpdatedDatetime,
} from "@/store/metadata";
import { ServiceRequest } from "@/entities";

const API_BASE_URL = "https://data.sfgov.org/resource/vw6y-z8j6.json";
// 50k is maximum allowed by SODA 2.1
// 10k causes issues with Postgres bulk insert parameter limits
const BATCH_SIZE = 1000;
const DELAY_MS = 500;

// It takes ~1.5s per batch. 20 batches is ~30s. Vercel free plan has max timeout limit of 60s.
const MAX_BATCHES_PER_RUN = 20;

// Type for raw API response from SF 311 data
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
  latestUpdatedDatetime: Date
): Promise<RawServiceRequestData[]> {
  const formattedDate = latestUpdatedDatetime.toISOString().slice(0, 23);
  const query =
    `$limit=${BATCH_SIZE}` +
    `&$offset=${offset}` +
    `&$where=updated_datetime > '${encodeURIComponent(formattedDate)}'` +
    `&$order=updated_datetime ASC`;
  const url = `${API_BASE_URL}?${query}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${response.statusText}`
    );
  }

  return response.json();
}

export async function ingestServiceRequests() {
  let batchesProcessed = 0;
  let offset = 0;
  let totalProcessed = 0;
  // Because we use the offset to paginate the query, we should use a fixed updated_datetime for all batches
  const latestUpdatedDatetime = await getLatestUpdatedDatetime();

  try {
    while (batchesProcessed < MAX_BATCHES_PER_RUN) {
      console.info(
        `Fetching batch ${batchesProcessed + 1} with offset ${offset} and latestUpdatedDatetime ${latestUpdatedDatetime}`
      );
      const rawData = await fetchDataChunk(offset, latestUpdatedDatetime);

      if (rawData.length === 0) {
        console.info("No more data to fetch");
        break;
      }

      const transformedData = transformData(rawData);
      await createMany(transformedData);

      totalProcessed += rawData.length;
      console.info(`Processed ${totalProcessed} records so far`);

      if (rawData.length < BATCH_SIZE) {
        console.info("Reached end of data");
        break;
      }

      offset += BATCH_SIZE;
      batchesProcessed++;

      // Add delay to avoid any rate limiting
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    // After batch completes, set the latest updated datetime
    await setLatestUpdatedDatetime();

    console.info(`Completed! Total records processed: ${totalProcessed}`);
  } catch (error) {
    console.error("Error scraping data:", error);
    throw error;
  }
}

function transformData(
  rawData: RawServiceRequestData[]
): Omit<ServiceRequest, "created_at" | "updated_at">[] {
  return rawData.map((item) => ({
    service_request_id: item.service_request_id,
    requested_datetime: new Date(item.requested_datetime),
    closed_date: item.closed_date ? new Date(item.closed_date) : null,
    updated_datetime: item.updated_datetime
      ? new Date(item.updated_datetime)
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
    data_as_of: item.data_as_of ? new Date(item.data_as_of) : null,
    data_loaded_at: item.data_loaded_at ? new Date(item.data_loaded_at) : null,
    lat: item.lat ? parseFloat(item.lat) : null,
    long: item.long ? parseFloat(item.long) : null,
    media_url: item.media_url?.url || null,
  }));
}
