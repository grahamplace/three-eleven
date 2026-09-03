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

## Deployment

Vercel builds run `scripts/vercel-build.mjs` (the `vercel-build` script). On production
builds it applies pending migrations with dbmate *before* `next build`, so new code never
deploys ahead of the schema it needs, and a failed migration fails the deploy. Preview
builds skip migrations. This replaces the old GitHub Action, which raced the Vercel deploy.

Requires `DATABASE_URL` in the Vercel production environment (already needed at runtime) and
the project's Build Command left at its default so the `vercel-build` script is picked up.

## API

Map payloads are served by cacheable `GET` routes (CDN `s-maxage=3600`, busted after each
nightly ingest). Both take `start`/`end` as `YYYY-MM-DD` and an optional predefined `query` id.

- `GET /api/points?start=&end=&query=` → `{ points: [[id, lng, lat], ...] }`
- `GET /api/hexbins?start=&end=&res=9&query=` → `{ resolution, cells: [[h3, count], ...] }`
