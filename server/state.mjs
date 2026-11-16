import { requireRole } from "./auth.mjs";
import {
  citySchema,
  idSchema,
  metaSchema,
  parseBody,
  routeSchema,
  uuidSchema,
} from "./validation.mjs";

const cityColumns = [
  "status",
  "planned_date",
  "recorded_date",
  "description",
  "notes",
  "video_url",
  "instagram_url",
  "tiktok_url",
  "restaurants",
  "hotels",
  "locations",
  "attractions",
  "contacts",
];
const cityValues = (city) => [
  city.status,
  city.plannedDate || null,
  city.recordedDate || null,
  city.description ?? null,
  city.notes ?? null,
  city.videoUrl ?? null,
  city.instagramUrl ?? null,
  city.tiktokUrl ?? null,
  city.restaurants ?? null,
  city.hotels ?? null,
  city.locations ?? null,
  city.attractions ?? null,
  city.contacts ?? null,
];
const optional = (value) => (value == null ? undefined : value);

function mapCity(row) {
  return {
    status: row.status,
    plannedDate: optional(row.planned_date),
    recordedDate: optional(row.recorded_date),
    description: optional(row.description),
    notes: optional(row.notes),
    videoUrl: optional(row.video_url),
    instagramUrl: optional(row.instagram_url),
    tiktokUrl: optional(row.tiktok_url),
    restaurants: optional(row.restaurants),
    hotels: optional(row.hotels),
    locations: optional(row.locations),
    attractions: optional(row.attractions),
    contacts: optional(row.contacts),
    checklist: [],
    history: [],
  };
}

export function stateRoutes(app, pool) {
  app.get("/api/state", requireRole("admin", "editor", "viewer"), async (_req, res) => {
    const [[cityRows], [checks], [history], [routeRows], [routeCities], [metaRows]] =
      await Promise.all([
        pool.execute("SELECT * FROM city_records"),
        pool.execute(
          "SELECT municipality_id,item_id,label,done FROM city_checklist ORDER BY municipality_id,position",
        ),
        pool.execute(
          "SELECT municipality_id,id,UNIX_TIMESTAMP(created_at)*1000 AS ts,text FROM city_history ORDER BY created_at DESC,id DESC",
        ),
        pool.execute("SELECT id,name FROM routes ORDER BY created_at,id"),
        pool.execute(
          "SELECT route_id,municipality_id FROM route_cities ORDER BY route_id,position",
        ),
        pool.execute("SELECT start_date,manual_km,next_recording FROM project_meta WHERE id=1"),
      ]);
    const cities = Object.fromEntries(cityRows.map((row) => [row.municipality_id, mapCity(row)]));
    for (const row of checks)
      cities[row.municipality_id]?.checklist.push({
        id: row.item_id,
        label: row.label,
        done: Boolean(row.done),
      });
    for (const row of history)
      cities[row.municipality_id]?.history.push({ id: row.id, ts: Number(row.ts), text: row.text });
    const routes = routeRows.map((row) => ({
      id: row.id,
      name: row.name,
      cityIds: routeCities
        .filter((item) => item.route_id === row.id)
        .map((item) => item.municipality_id),
    }));
    const meta = metaRows[0]
      ? {
          startDate: metaRows[0].start_date,
          manualKm: Number(metaRows[0].manual_km),
          nextRecording: optional(metaRows[0].next_recording),
        }
      : { startDate: new Date().toISOString().slice(0, 10), manualKm: 0 };
    res.json({ cities, roteiros: routes, meta });
  });

  app.put("/api/cities/:id", requireRole("admin", "editor"), async (req, res) => {
    const id = parseBody(idSchema, req.params.id);
    const city = parseBody(citySchema, req.body);
    if (new Set(city.checklist.map((item) => item.id)).size !== city.checklist.length)
      return res.status(400).json({ error: "Checklist contém IDs repetidos." });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const placeholders = cityColumns.map(() => "?").join(",");
      const updates = cityColumns.map((name) => `${name}=VALUES(${name})`).join(",");
      await connection.execute(
        `INSERT INTO city_records (municipality_id,${cityColumns.join(",")}) VALUES (?,${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`,
        [id, ...cityValues(city)],
      );
      await connection.execute("DELETE FROM city_checklist WHERE municipality_id=?", [id]);
      for (const [position, item] of city.checklist.entries())
        await connection.execute(
          "INSERT INTO city_checklist (municipality_id,item_id,label,done,position) VALUES (?,?,?,?,?)",
          [id, item.id, item.label, item.done, position],
        );
      // The existing UI maintains a bounded, editable history; store that exact snapshot.
      await connection.execute("DELETE FROM city_history WHERE municipality_id=?", [id]);
      for (const item of city.history)
        await connection.execute(
          "INSERT INTO city_history (id,municipality_id,created_at,text,actor_user_id) VALUES (?,?,FROM_UNIXTIME(?),?,?)",
          [item.id, id, item.ts / 1000, item.text, req.user.id],
        );
      await connection.commit();
      res.json({ city });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.put("/api/routes/:id", requireRole("admin", "editor"), async (req, res) => {
    const id = parseBody(uuidSchema, req.params.id);
    const route = parseBody(routeSchema, req.body);
    if (route.id !== id || new Set(route.cityIds).size !== route.cityIds.length)
      return res.status(400).json({ error: "Roteiro inválido." });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "INSERT INTO routes (id,name) VALUES (?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
        [id, route.name],
      );
      await connection.execute("DELETE FROM route_cities WHERE route_id=?", [id]);
      for (const [position, cityId] of route.cityIds.entries())
        await connection.execute(
          "INSERT INTO route_cities (route_id,municipality_id,position) VALUES (?,?,?)",
          [id, cityId, position],
        );
      await connection.commit();
      res.json({ route });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });
  app.delete("/api/routes/:id", requireRole("admin", "editor"), async (req, res) => {
    const id = parseBody(uuidSchema, req.params.id);
    await pool.execute("DELETE FROM routes WHERE id=?", [id]);
    res.status(204).end();
  });
  app.put("/api/meta", requireRole("admin", "editor"), async (req, res) => {
    const meta = parseBody(metaSchema, req.body);
    await pool.execute(
      "INSERT INTO project_meta (id,start_date,manual_km,next_recording) VALUES (1,?,?,?) ON DUPLICATE KEY UPDATE start_date=VALUES(start_date),manual_km=VALUES(manual_km),next_recording=VALUES(next_recording)",
      [meta.startDate, meta.manualKm, meta.nextRecording || null],
    );
    res.json({ meta });
  });
}
