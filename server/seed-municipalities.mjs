import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readConfig } from "./config.mjs";
import { createPool } from "./db.mjs";

const features = JSON.parse(
  await readFile(resolve("public/sc-municipios.geojson"), "utf8"),
).features;
if (features.length !== 295) throw new Error("GeoJSON não contém 295 municípios.");
const pool = createPool(readConfig().db);
try {
  for (const { properties: city } of features) {
    await pool.execute(
      "INSERT INTO municipalities (id,name,region) VALUES (?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),region=VALUES(region)",
      [city.id, city.name, city.region],
    );
  }
  console.log("295 municípios carregados do GeoJSON.");
} finally {
  await pool.end();
}
