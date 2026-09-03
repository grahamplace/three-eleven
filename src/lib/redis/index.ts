import { createClient, type RedisClientType } from "redis";
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

// A single shared client for the lifetime of the process. Previously every
// call created and connected a new client and never closed it, which leaked
// one Redis connection per page request.
let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client?.isOpen) {
    return client;
  }
  if (!connecting) {
    connecting = (async () => {
      const c = createClient({ url: env.REDIS_URL }) as RedisClientType;
      // Without an error listener a dropped connection emits an unhandled
      // 'error' event and crashes the process.
      c.on("error", (err) => {
        console.error("Redis client error:", err);
      });
      await c.connect();
      client = c;
      return c;
    })().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

/** Closes the shared client. Call at the end of scripts so the process can exit. */
export async function closeRedis(): Promise<void> {
  if (client?.isOpen) {
    const c = client;
    client = null;
    await c.quit();
  }
}
