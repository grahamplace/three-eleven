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

#### Queries

We use [pgtyped](https://github.com/adelsz/pgtyped) to generate TypeScript types from our SQL queries:

- Add a new query to `db/queries/{name}.sql`
- Run `npm run queries` to generate the types in `src/store/queries/`

## API

Map payloads are served by cacheable `GET` routes (CDN `s-maxage=3600`, busted after each
nightly ingest). Both take `start`/`end` as `YYYY-MM-DD` and an optional predefined `query` id.

- `GET /api/points?start=&end=&query=` → `{ points: [[id, lng, lat], ...] }`
- `GET /api/hexbins?start=&end=&res=9&query=` → `{ resolution, cells: [[h3, count], ...] }`
