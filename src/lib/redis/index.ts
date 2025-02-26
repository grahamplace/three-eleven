import { createClient } from "redis";
import { envobj, string } from "envobj";

const env = envobj(
  {
    REDIS_URL: string,
    ENV: string,
  },
  process.env as Record<string, string | undefined>,
  {
    ENV: "development",
  }
);

export function prefixKey(key: string) {
  return `${env.ENV}:${key}`;
}

export function getRedisClient() {
  const redis = createClient({
    url: env.REDIS_URL,
  });

  redis.connect();

  return redis;
}
