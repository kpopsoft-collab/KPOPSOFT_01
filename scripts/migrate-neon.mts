import { Client } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const migrationsDirectory = join(process.cwd(), "database", "migrations");
const filenames = (await readdir(migrationsDirectory))
  .filter((filename) => filename.endsWith(".sql"))
  .sort((left, right) => left.localeCompare(right));

const client = new Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const appliedResult = await client.query<{ filename: string }>(
    "select filename from schema_migrations",
  );
  const applied = new Set(appliedResult.rows.map((row) => row.filename));

  for (const filename of filenames) {
    if (applied.has(filename)) continue;

    const migration = await readFile(
      join(migrationsDirectory, filename),
      "utf8",
    );

    await client.query("begin");
    try {
      await client.query(migration);
      await client.query(
        "insert into schema_migrations (filename) values ($1)",
        [filename],
      );
      await client.query("commit");
      console.info(`Applied migration: ${filename}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
