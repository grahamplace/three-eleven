import pg from "pg";
import { envobj, string } from "envobj";
import { fromSfWallClock } from "@/lib/time";

const { Pool } = pg;

// `timestamp without time zone` columns hold SF 311's Pacific wall-clock
// values (see src/lib/time.ts). node-postgres would otherwise interpret them
// in the process's local zone, which is UTC on Vercel and Pacific on a laptop,
// so the same row would read back as two different instants.
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, fromSfWallClock);

export const env = envobj(
  {
    DATABASE_URL: string,
    ENV: string,
  },
  process.env as Record<string, string | undefined>,
  {
    ENV: "development",
    DATABASE_URL: "postgres://@localhost:5432/three_eleven?sslmode=disable",
  },
);

type QueryParams = readonly unknown[];

/**
 * Minimal connection shape shared by the pool and by a transaction-scoped
 * client. Structurally compatible with pgtyped's IDatabaseConnection, so any
 * generated query can run against either.
 */
export type DbConnection = {
  query: (
    query: string,
    bindings?: QueryParams,
  ) => Promise<{ rows: any[]; rowCount: number }>;
};

// The pool is created on first use rather than at import time so that
// importing this module (e.g. during `next build` or in unit tests) never
// opens a socket or crashes the process.
let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL });
    // Idle clients can be dropped by the server; without a listener the
    // resulting 'error' event would crash the process.
    pool.on("error", (err) => {
      console.error("Unexpected error on idle Postgres client:", err);
    });
  }
  return pool;
}

function wrap(queryable: pg.Pool | pg.PoolClient): DbConnection {
  return {
    query: async (query, bindings = []) => {
      const result = await queryable.query(query, bindings as unknown[]);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    },
  };
}

export const db: DbConnection = {
  query: (query, bindings) => wrap(getPool()).query(query, bindings),
};

/**
 * Runs `fn` inside a single transaction. Commits if it resolves, rolls back
 * if it throws, and always returns the client to the pool.
 */
export async function withTransaction<T>(
  fn: (tx: DbConnection) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(wrap(client));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Drains the pool. Call at the end of scripts so the process can exit. */
export async function closeDb(): Promise<void> {
  if (pool) {
    const p = pool;
    pool = null;
    await p.end();
  }
}
