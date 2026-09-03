/**
 * Vercel runs this instead of `next build` (via the `vercel-build` script).
 *
 * Production builds apply pending migrations first, so a deploy can never
 * ship code that expects a column the database doesn't have yet, and a failed
 * migration fails the deploy instead of leaving new code against an old
 * schema. Preview builds skip migrations: they share the production database
 * URL and must not change its schema from an unmerged branch.
 */
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (process.env.VERCEL_ENV === "production") {
  console.log("Production build: applying pending migrations");
  run("npx dbmate --no-dump-schema -e DATABASE_URL up");
} else {
  console.log(
    `Skipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`,
  );
}

run("npx next build");
