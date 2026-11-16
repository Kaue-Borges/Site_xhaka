import { readConfig } from "./config.mjs";
import { createPool } from "./db.mjs";
import { createApp } from "./app.mjs";

const config = readConfig();
const pool = createPool(config.db);
const app = createApp({ pool, config });
const server = app.listen(config.port, () =>
  console.log(`Xhakinha ouvindo na porta ${config.port}`),
);

for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
