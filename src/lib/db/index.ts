import pg from "pg";
import { envobj, string } from "envobj";

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

export const db = {
  query: async (query: string, bindings: any[]) => {
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
