# Three Eleven

## Development

### Quickstart

- Create a new local Postgres 16 database called `three_eleven`
- Add `DATABASE_URL="{your-connection-uri}"` to `.env.local` in your project's root directory

```
npm install
npm run migrate up
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

#### Queries

We use [pgtyped](https://github.com/adelsz/pgtyped) to generate TypeScript types from our SQL queries:

- Add a new query to `db/queries/{name}.sql`
- Run `npm run queries` to generate the types in `src/store/queries/`
