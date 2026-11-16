import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createApp } from "./app.mjs";
import { hashPassword, verifyPassword } from "./security.mjs";

const config = { nodeEnv: "production", sessionSecret: "a".repeat(40) };
const pool = {
  query: async () => [[{ ok: 1 }]],
  execute: async (sql) =>
    sql.includes("FROM sessions")
      ? [[{ id: 1, email: "editor@example.test", name: "Editor", role: "editor" }]]
      : [[]],
};

async function withServer(callback) {
  const server = createApp({ pool, config }).listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("scrypt verifica a senha correta e rejeita outra", async () => {
  const hash = await hashPassword("senha-unica-longa");
  assert.equal(hash.includes("senha-unica-longa"), false);
  assert.equal(await verifyPassword("senha-unica-longa", hash), true);
  assert.equal(await verifyPassword("errada", hash), false);
});

test("login real emite cookie seguro e rejeita senha errada", async () => {
  const passwordHash = await hashPassword("senha-boa-de-teste");
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      if (sql.includes("FROM login_attempts"))
        return [[{ failures: 0, fresh_window: 0, is_locked: 0 }]];
      if (sql.includes("FROM users"))
        return [
          [
            {
              id: 1,
              email: "admin@example.test",
              name: "Admin",
              role: "admin",
              password_hash: passwordHash,
            },
          ],
        ];
      return [[]];
    },
  };
  const loginPool = { ...pool, getConnection: async () => connection };
  const server = createApp({ pool: loginPool, config }).listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = {
      "x-forwarded-proto": "https",
      origin: `https://127.0.0.1:${server.address().port}`,
      "content-type": "application/json",
    };
    let response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "admin@example.test", password: "errada" }),
    });
    assert.equal(response.status, 401);
    response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "admin@example.test", password: "senha-boa-de-teste" }),
    });
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Lax/);
    assert.equal((await response.json()).user.role, "admin");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("login bloqueia a sexta tentativa depois de cinco falhas", async () => {
  let failures = 0;
  const passwordHash = await hashPassword("senha-boa-de-teste");
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql, params) => {
      if (sql.includes("FROM login_attempts"))
        return [[{ failures, fresh_window: 0, is_locked: failures >= 5 ? 1 : 0 }]];
      if (sql.includes("FROM users"))
        return [
          [
            {
              id: 1,
              email: "admin@example.test",
              name: "Admin",
              role: "admin",
              password_hash: passwordHash,
            },
          ],
        ];
      if (sql.includes("UPDATE login_attempts")) failures = params[0];
      return [[]];
    },
  };
  const server = createApp({
    pool: { ...pool, getConnection: async () => connection },
    config,
  }).listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = {
      "x-forwarded-proto": "https",
      origin: `https://127.0.0.1:${server.address().port}`,
      "content-type": "application/json",
    };
    for (let attempt = 1; attempt <= 6; attempt++) {
      const response = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: "admin@example.test", password: "errada" }),
      });
      assert.equal(response.status, attempt <= 5 ? 401 : 429);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("API exige sessão, HTTPS e origem em produção", async () =>
  withServer(async (base) => {
    const headers = { "x-forwarded-proto": "https" };
    let response = await fetch(`${base}/api/state`, { headers });
    assert.equal(response.status, 401);
    response = await fetch(`${base}/api/health`, { headers });
    assert.equal(response.status, 200);
    response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 403);
    response = await fetch(`${base}/api/meta`, {
      method: "PUT",
      headers: {
        ...headers,
        cookie: "xhaka_session=test",
        "content-type": "application/json",
        origin: "https://evil.example",
      },
      body: "{}",
    });
    assert.equal(response.status, 403);
  }));

test("escritas validam papel e payload antes de acessar o banco", async () =>
  withServer(async (base) => {
    const origin = `https://${new URL(base).host}`;
    const headers = {
      "x-forwarded-proto": "https",
      origin,
      "content-type": "application/json",
      cookie: "xhaka_session=test",
    };
    let response = await fetch(`${base}/api/cities/invalido`, {
      method: "PUT",
      headers,
      body: "{}",
    });
    assert.equal(response.status, 400);
    response = await fetch(`${base}/api/routes/not-a-uuid`, { method: "PUT", headers, body: "{}" });
    assert.equal(response.status, 400);
    response = await fetch(`${base}/api/meta`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ startDate: "invalida", manualKm: -1 }),
    });
    assert.equal(response.status, 400);
  }));

test("cidade, roteiro e métricas usam as consultas de gravação esperadas", async () => {
  const statements = [];
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql) => {
      statements.push(sql);
      return [[]];
    },
  };
  const writingPool = {
    ...pool,
    getConnection: async () => connection,
    execute: async (sql) => {
      if (sql.includes("FROM sessions")) return pool.execute(sql);
      statements.push(sql);
      return [[]];
    },
  };
  const server = createApp({ pool: writingPool, config }).listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = {
      "x-forwarded-proto": "https",
      origin: `https://127.0.0.1:${server.address().port}`,
      "content-type": "application/json",
      cookie: "xhaka_session=test",
    };
    let response = await fetch(`${base}/api/cities/4200051`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: "planned", checklist: [], history: [] }),
    });
    assert.equal(response.status, 200);
    response = await fetch(`${base}/api/routes/550e8400-e29b-41d4-a716-446655440000`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Rota",
        cityIds: ["4200051"],
      }),
    });
    assert.equal(response.status, 200);
    response = await fetch(`${base}/api/meta`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ startDate: "2026-11-13", manualKm: 10 }),
    });
    assert.equal(response.status, 200);
    assert.ok(statements.some((sql) => sql.includes("INSERT INTO city_records")));
    assert.ok(statements.some((sql) => sql.includes("INSERT INTO route_cities")));
    assert.ok(statements.some((sql) => sql.includes("INSERT INTO project_meta")));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("rotas da SPA, GeoJSON e fotografia são servidos", async () =>
  withServer(async (base) => {
    for (const path of [
      "/",
      "/mapa",
      "/roteiros",
      "/roteirizador",
      "/timeline",
      "/sc-municipios.geojson",
      "/images/xhaka/carro-mapa.webp",
    ]) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200, path);
    }
    const geo = await (await fetch(`${base}/sc-municipios.geojson`)).json();
    assert.equal(geo.features.length, 295);
  }));

test("build de produção não contém entrada do modo demo", async () => {
  const files = await readdir("dist/assets");
  const js = (
    await Promise.all(
      files
        .filter((name) => name.endsWith(".js"))
        .map((name) => readFile(`dist/assets/${name}`, "utf8")),
    )
  ).join("\n");
  assert.equal(js.includes("Entrar na demonstração"), false);
  assert.equal(js.includes("demo@local.invalid"), false);
});

test("migration UTF-8 corresponde aos 295 municípios do GeoJSON", async () => {
  const sql = await readFile("migrations/002_municipalities_corrigido.sql", "utf8");
  const geo = JSON.parse(await readFile("public/sc-municipios.geojson", "utf8"));
  const rows = [...sql.matchAll(/^\('(\d{7})','((?:[^']|'')*)','((?:[^']|'')*)'\)/gm)]
    .map((match) => match.slice(1).map((value) => value.replaceAll("''", "'")))
    .sort(([idA], [idB]) => idA.localeCompare(idB));
  const source = geo.features
    .map(({ properties: { id, name, region } }) => [id, name, region])
    .sort(([idA], [idB]) => idA.localeCompare(idB));
  assert.equal(rows.length, 295);
  assert.equal(sql.includes("�"), false);
  assert.deepEqual(rows, source);
});
