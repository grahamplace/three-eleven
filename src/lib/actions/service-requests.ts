"use server";

import { ServiceRequest } from "@/entities";
import { find } from "@/store/service-request";
import { PREDEFINED_QUERIES } from "@/entities/query-definition";

// Map payloads (points, hexbins) are served by cacheable GET routes under
// /api. Server actions are POSTs and cannot be cached, so they are reserved
// for small, per-interaction reads like the detail panel.

export const getServiceRequestById = async (
  id: string
): Promise<ServiceRequest | null> => {
  const result = await find(id);
  return result;
};

export const getPredefinedQueries = async (): Promise<
  { id: string; name: string; description: string }[]
> => {
  return Object.values(PREDEFINED_QUERIES).map((query) => ({
    id: query.id,
    name: query.name,
    description: query.description,
  }));
};
