import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { authRoutes } from "./auth.mjs";
import { stateRoutes } from "./state.mjs";

export function createApp({
  pool,
  config,
  staticDir = fileURLToPath(new URL("../dist", import.meta.url)),
}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    if (config.nodeEnv === "production")
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
  app.use("/api", (req, res, next) => {
    if (config.nodeEnv === "production" && !req.secure)
      return res.status(403).json({ error: "HTTPS obrigatório." });
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const origin = req.get("origin");
      if (!origin || origin !== `${req.protocol}://${req.get("host")}`)
        return res.status(403).json({ error: "Origem inválida." });
      if (req.get("content-type")?.split(";")[0] !== "application/json")
        return res.status(415).json({ error: "JSON obrigatório." });
    }
    next();
  });
  app.use("/api", express.json({ limit: "100kb" }));
  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  });
  authRoutes(app, pool, config);
  stateRoutes(app, pool);
  app.use("/api", (_req, res) => res.status(404).json({ error: "Endpoint não encontrado." }));
  app.use(express.static(staticDir, { index: false, fallthrough: true, maxAge: "1h" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.includes(".")) return res.status(404).end();
    const index = resolve(staticDir, "index.html");
    if (!existsSync(index)) return res.status(503).send("Frontend ainda não compilado.");
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(index);
  });
  app.use((error, _req, res, _next) => {
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "Requisição grande demais." });
    if (error instanceof SyntaxError && error.status === 400)
      return res.status(400).json({ error: "JSON inválido." });
    if (error.status)
      return res.status(error.status).json({
        error: error.message,
        ...(config.nodeEnv !== "production" && error.details ? { details: error.details } : {}),
      });
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Registro já existe." });
    if (error.code === "ER_NO_REFERENCED_ROW_2")
      return res.status(400).json({ error: "Município ou referência não encontrado." });
    console.error("API error:", error);
    const status = ["ECONNREFUSED", "PROTOCOL_CONNECTION_LOST", "ETIMEDOUT"].includes(error.code)
      ? 503
      : 500;
    res.status(status).json({
      error: status === 503 ? "Banco temporariamente indisponível." : "Erro interno do servidor.",
    });
  });
  return app;
}
