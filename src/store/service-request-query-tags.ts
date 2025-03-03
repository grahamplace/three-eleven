import { db } from "@/lib/db";
import * as queries from "@/store/queries/service_request_query_tags.queries";
import { ServiceRequest } from "@/entities";
import { getMatchingQueryIds } from "@/entities/query-definition";

export const createQueryTags = async (serviceRequest: ServiceRequest) => {
  try {
    const queryIds = getMatchingQueryIds(serviceRequest);

    if (queryIds.length === 0) {
      return [];
    }

    const tags = queryIds.map((queryId) => ({
      service_request_id: serviceRequest.service_request_id,
      query_id: queryId,
    }));

    await queries.createServiceRequestQueryTags.run({ tags }, db);
    return queryIds;
  } catch (error) {
    console.error("Error creating service request query tags:", error);
    return [];
  }
};

export const createQueryTagsForMany = async (
  serviceRequests: ServiceRequest[],
) => {
  try {
    const allTags: { service_request_id: string; query_id: string }[] = [];

    for (const serviceRequest of serviceRequests) {
      const queryIds = getMatchingQueryIds(serviceRequest);

      if (queryIds.length > 0) {
        const tags = queryIds.map((queryId) => ({
          service_request_id: serviceRequest.service_request_id,
          query_id: queryId,
        }));

        allTags.push(...tags);
      }
    }

    if (allTags.length === 0) {
      return [];
    }

    await queries.createServiceRequestQueryTags.run({ tags: allTags }, db);
    return allTags;
  } catch (error) {
    console.error("Error creating service request query tags for many:", error);
    return [];
  }
};

export const findServiceRequestsByQueryId = async (
  queryId: string,
  dateStart: string,
  dateEnd: string,
) => {
  try {
    const results = await queries.findServiceRequestsByQueryId.run(
      {
        query_id: queryId,
        date_start: dateStart,
        date_end: dateEnd,
      },
      db,
    );

    return results;
  } catch (error) {
    console.error("Error finding service requests by query ID:", error);
    return [];
  }
};

export const deleteQueryTags = async (serviceRequestId: string) => {
  try {
    await queries.deleteServiceRequestQueryTags.run(
      { service_request_id: serviceRequestId },
      db,
    );
    return true;
  } catch (error) {
    console.error("Error deleting service request query tags:", error);
    return false;
  }
};
