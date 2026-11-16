import mysql from "mysql2/promise";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readConfig } from "./config.mjs";

const config = readConfig();
const connection = await mysql.createConnection({
  ...config.db,
  multipleStatements: true,
  timezone: "Z",
});
try {
  await connection.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(100) NOT NULL PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  );
  const files = (await readdir(resolve("migrations")))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();
  for (const file of files) {
    const [rows] = await connection.execute(
      "SELECT version FROM schema_migrations WHERE version=?",
      [file],
    );
    if (rows.length) continue;
    await connection.query(await readFile(resolve("migrations", file), "utf8"));
    await connection.execute("INSERT INTO schema_migrations (version) VALUES (?)", [file]);
    console.log(`Migration aplicada: ${file}`);
  }
} finally {
  await connection.end();
}
