import { getRedisClient, prefixKey } from "@/lib/redis";
import { getLatestUpdatedDatetimeFromPg } from "./service-request";

const KEY = "latest_updated_datetime";

export const getLatestUpdatedDatetime = async () => {
  const redis = await getRedisClient();
  const result = await redis.get(prefixKey(KEY));
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
  const redis = await getRedisClient();

  const pgLatestUpdatedDatetime = await getLatestUpdatedDatetimeFromPg();
  if (pgLatestUpdatedDatetime === null) {
    throw new Error("No updated datetime found");
  }

  await redis.set(prefixKey(KEY), pgLatestUpdatedDatetime.toISOString());
};
