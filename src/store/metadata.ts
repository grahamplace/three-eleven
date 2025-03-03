import { getRedisClient, prefixKey } from "@/lib/redis";
import { getLatestUpdatedDatetimeFromPg } from "./service-request";

export const getLatestUpdatedDatetime = async () => {
  const redis = getRedisClient();
  const result = await redis.get(prefixKey("latest_updated_datetime"));
  // If there is no result in redis, we need to fetch it from the database
  if (result === null) {
    const pgLatestUpdatedDatetime = await getLatestUpdatedDatetimeFromPg();
    if (pgLatestUpdatedDatetime === null) {
      throw new Error("No updated datetime found");
    }
    return pgLatestUpdatedDatetime;
  }

  return new Date(result);
};

export const setLatestUpdatedDatetime = async () => {
  const redis = getRedisClient();

  const pgLatestUpdatedDatetime = await getLatestUpdatedDatetimeFromPg();
  if (pgLatestUpdatedDatetime === null) {
    throw new Error("No updated datetime found");
  }

  await redis.set(
    prefixKey("latest_updated_datetime"),
    pgLatestUpdatedDatetime.toISOString(),
  );
};
