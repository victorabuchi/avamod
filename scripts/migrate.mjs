// Applies migrations/*.sql in order, once each. Run: npm run migrate
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";
import "dotenv/config";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
const done = new Set((await client.query("select name from schema_migrations")).rows.map((r) => r.name));
for (const f of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(f)) continue;
  await client.query("begin");
  try {
    await client.query(readFileSync(`migrations/${f}`, "utf8"));
    await client.query("insert into schema_migrations (name) values ($1)", [f]);
    await client.query("commit");
    console.log("applied", f);
  } catch (e) {
    await client.query("rollback");
    throw e;
  }
}
await client.end();
