// Create (or update) an account from the command line. Run:
//   EMAIL=a@b.com NAME="A B" PASSWORD=... PLAN=admin npx tsx scripts/create-user.mts
// Plan "admin" = every feature, unlimited designs. The password is read from the
// environment so it never lands in the repo or shell history files you commit.
import "dotenv/config";
import pg from "pg";
import { hashPassword } from "../lib/auth/password";

const { EMAIL, NAME, PASSWORD, PLAN = "free" } = process.env;
if (!EMAIL || !NAME || !PASSWORD) throw new Error("EMAIL, NAME and PASSWORD are required");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const hash = await hashPassword(PASSWORD);
const r = await db.query(
  `insert into users (email, name, password_hash, plan) values ($1, $2, $3, $4)
   on conflict (lower(email)) do update set name = $2, password_hash = $3, plan = $4
   returning id, email, plan`,
  [EMAIL.toLowerCase(), NAME, hash, PLAN],
);
console.log(r.rows[0]);
await db.end();
