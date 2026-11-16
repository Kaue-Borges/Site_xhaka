import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const geojsonPath = fileURLToPath(new URL("../public/sc-municipios.geojson", import.meta.url));
const outputPath = fileURLToPath(
  new URL("../migrations/002_municipalities_corrigido.sql", import.meta.url),
);
const geojson = JSON.parse(await readFile(geojsonPath, "utf8"));
const cities = geojson.features.map(({ properties }) => properties);
if (cities.length !== 295 || new Set(cities.map(({ id }) => id)).size !== 295) {
  throw new Error("O GeoJSON precisa conter 295 IDs de municípios únicos.");
}

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const rows = cities.map(({ id, name, region }) => {
  if (!/^\d{7}$/.test(id) || !name || !region || /\uFFFD|Ã.|Â./u.test(`${name}${region}`)) {
    throw new Error(`Município com dados ou codificação inválidos: ${id}`);
  }
  return `(${quote(id)},${quote(name)},${quote(region)})`;
});
const sql = [
  "-- Gerado do GeoJSON em UTF-8. Não contém dados de viagem.",
  "SET NAMES utf8mb4;",
  "INSERT INTO municipalities (id,name,region) VALUES",
  rows.join(",\n"),
  "ON DUPLICATE KEY UPDATE name=VALUES(name),region=VALUES(region);",
  "",
].join("\n");
await writeFile(outputPath, sql, "utf8");
console.log(`Migration UTF-8 gerada com ${cities.length} municípios.`);
