# Three Eleven ([sfdata.app](https://sfdata.app))

## Development

### Quickstart

- Create a new local Postgres 16 database called `three_eleven`
- Add `DATABASE_URL="{your-connection-uri}"` to `.env.local` in your project's root directory

```
npm install
npm run migrate up
npm run seed-db
npm run development
```

### Database

#### Migrations

We use [dbmate](https://github.com/amacneil/dbmate) to manage database migrations:

```
npm run migrate new {migration_name}
npm run migrate up
npm run migrate down
```

#### H3 hexbin columns

Each service request stores its H3 cell id at resolutions 7–11 (`h3_r7` … `h3_r11`) so
hexbin counts are a `GROUP BY` in Postgres rather than a per-point loop in the browser.
New rows get these at write time. After deploying the migration that adds the columns,
backfill existing rows once:

```
npm run backfill-h3
```

#### Hexbin rollup

Counting cells from `service_requests` means reading every row in the window — ~500k for
a year, spread across a ~470-byte-wide table for a 16-byte cell id — which Postgres turns
into a sequential scan of the whole table. A one-year hexbin query timed out in
production at 15s.

`service_request_h3_daily` holds per-day counts keyed by `(query_id, resolution, day,
cell)`, so the same window is an index-only scan over ~15MB (~165ms measured on 3M rows,
against ~1.4s counting raw rows and ~2.4s for a filtered one). `query_id` is `''` for the
unfiltered map and the query id for a filtered one, so both read the same shape.

The rollup covers a trailing window (`ROLLUP_HORIZON_DAYS`, 800 days) rather than all of
history: the date picker caps a range at 730 days, so every window that ends near today
is covered, while the table stays ~1GB instead of outgrowing `service_requests`. Windows
that start before the horizon fall back to counting raw rows.

Maintenance is automatic — the store recomputes the days a batch touches inside the
ingest transaction, and the nightly job prunes what has aged out. Two cases need a
manual push:

```
npm run backfill-h3-daily                                  # first fill, or after a gap
npm run backfill-h3-daily -- --from=2024-01-01 --to=2024-06-30
```

Changing `PREDEFINED_QUERIES` re-tags every request, which moves counts between query
series; the monthly tag backfill triggers the `rebuild-h3-rollup` Inngest function on
completion to rebuild them. It can also be sent by hand from the Inngest dashboard
(`h3-rollup.rebuild`).

#### Timestamps

SF 311 publishes datetimes as Pacific wall-clock values with no zone (Socrata "floating"
timestamps). They are stored as-is in `timestamp` columns so `DATE(requested_datetime)` is
the San Francisco calendar day. Every conversion between those strings and JavaScript
`Date`s goes through `src/lib/time.ts`, and the UI always renders San Francisco time, so
behaviour is the same whether the code runs on Vercel (UTC) or a laptop.

#### Queries

We use [pgtyped](https://github.com/adelsz/pgtyped) to generate TypeScript types from our SQL queries:

- Add a new query to `db/queries/{name}.sql`
- Run `npm run queries` to generate the types in `src/store/queries/`

### Testing

```
npm test            # unit + component tests (vitest)
npm run test:e2e    # browser flows (Playwright) against a running app + database
```

The e2e suite mocks the map data routes at the network layer and reads one seeded row
(`npm run seed-db`) for the detail panel. CI runs it in Chromium against the production
build with Postgres and Redis service containers. Locally it reuses `npm run dev`, or set
`PORT` to point at another server.

## Deployment

Vercel builds run `scripts/vercel-build.mjs` (the `vercel-build` script). On production
builds it applies pending migrations with dbmate _before_ `next build`, so new code never
deploys ahead of the schema it needs, and a failed migration fails the deploy. Preview
builds skip migrations. This replaces the old GitHub Action, which raced the Vercel deploy.

Requires `DATABASE_URL` in the Vercel production environment (already needed at runtime) and
the project's Build Command left at its default so the `vercel-build` script is picked up.

## API

Map payloads are served by cacheable `GET` routes (CDN `s-maxage=3600`, busted after each
nightly ingest). Both take `start`/`end` as `YYYY-MM-DD` and an optional predefined `query` id.

- `GET /api/points?start=&end=&query=` → `{ points: [[id, lng, lat], ...] }`
- `GET /api/hexbins?start=&end=&res=9&query=` → `{ resolution, cells: [[h3, count], ...] }`
