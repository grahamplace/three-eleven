import pg from "pg";
import { envobj, string } from "envobj";
import type { QueryConfigValues } from "pg";

const { Client } = pg;

export const env = envobj(
  {
    DATABASE_URL: string,
    ENV: string,
  },
  process.env as Record<string, string | undefined>,
  {
    ENV: "development",
    DATABASE_URL: "postgres://@localhost:5432/three_eleven?sslmode=disable",
  }
);

type QueryParams = (string | number | boolean | Date | null | undefined)[];

export const db = {
  query: async (query: string, bindings: QueryConfigValues<QueryParams>) => {
    const result = await client.query(query, bindings);
    return { rows: result.rows };
  },
};

const client = new Client({
  connectionString: env.DATABASE_URL,
});

client.connect().catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});
