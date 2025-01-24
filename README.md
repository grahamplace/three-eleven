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

### Migrations

We use [dbmate](https://github.com/amacneil/dbmate) to manage database migrations:

```
npm run migrate new {migration_name}
npm run migrate up
npm run migrate down
```
