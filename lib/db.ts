import pg from "pg";

// One pool per server process (kept on globalThis so dev hot reload does not leak connections).
const g = globalThis as unknown as { __pool?: pg.Pool };

export const pool = (g.__pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 }));

export async function one<T extends pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await pool.query<T>(text, params)).rows[0] ?? null;
}

export async function many<T extends pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query<T>(text, params)).rows;
}
