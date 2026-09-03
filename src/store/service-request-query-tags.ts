import { db, type DbConnection } from "@/lib/db";
import * as queries from "@/store/queries/service_request_query_tags.queries";
import { getMatchingQueryIds } from "@/entities/query-definition";

type Taggable = Parameters<typeof getMatchingQueryIds>[0] & {
  service_request_id: string;
};

export type QueryTag = { service_request_id: string; query_id: string };

/** Pure: computes the (service_request_id, query_id) rows for a batch. */
export function computeQueryTags(serviceRequests: Taggable[]): QueryTag[] {
  const tags: QueryTag[] = [];
  for (const serviceRequest of serviceRequests) {
    for (const queryId of getMatchingQueryIds(serviceRequest)) {
      tags.push({
        service_request_id: serviceRequest.service_request_id,
        query_id: queryId,
      });
    }
  }
  return tags;
}

/**
 * Replaces the query tags for a batch of service requests so they reflect the
 * requests' current fields. Deleting first means a request that is
 * re-categorized upstream loses its stale tag instead of accumulating both.
 *
 * Errors propagate to the caller. Pass a transaction-scoped connection to make
 * this atomic with the surrounding upsert.
 */
export async function replaceQueryTagsForMany(
  serviceRequests: Taggable[],
  conn: DbConnection = db,
): Promise<QueryTag[]> {
  if (serviceRequests.length === 0) {
    return [];
  }

  await queries.deleteServiceRequestQueryTagsForMany.run(
    { service_request_ids: serviceRequests.map((sr) => sr.service_request_id) },
    conn,
  );

  const tags = computeQueryTags(serviceRequests);
  if (tags.length > 0) {
    await queries.createServiceRequestQueryTags.run({ tags }, conn);
  }
  return tags;
}
