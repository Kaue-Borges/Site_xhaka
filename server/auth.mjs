import {
  cookieValue,
  clearCookie,
  hashPassword,
  newToken,
  publicUser,
  tokenDigest,
  verifyPassword,
} from "./security.mjs";
import { loginSchema, parseBody, userSchema } from "./validation.mjs";

const DUMMY_HASH = await hashPassword("this-is-not-a-real-password");
const SESSION_DAYS = 7;

export function authRoutes(app, pool, config) {
  const secure = config.nodeEnv === "production";

  app.use("/api", async (req, res, next) => {
    try {
      const token = /(?:^|;\s*)xhaka_session=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
      if (token) {
        const [rows] = await pool.execute(
          "SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() AND u.active=1 LIMIT 1",
          [tokenDigest(config.sessionSecret, token)],
        );
        if (rows.length) req.user = publicUser(rows[0]);
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", (req, res) => res.json({ user: req.user ?? null }));

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);
    const normalized = email.trim().toLowerCase();
    const key = tokenDigest(config.sessionSecret, `${req.ip}:${normalized}`);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "INSERT IGNORE INTO login_attempts (attempt_key, failures, window_started) VALUES (?,0,UTC_TIMESTAMP())",
        [key],
      );
      const [attemptRows] = await connection.execute(
        "SELECT failures,window_started < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE) AS fresh_window,locked_until > UTC_TIMESTAMP() AS is_locked FROM login_attempts WHERE attempt_key=? FOR UPDATE",
        [key],
      );
      const attempt = attemptRows[0];
      if (attempt.is_locked) {
        await connection.commit();
        return res.status(429).json({ error: "Muitas tentativas. Tente novamente mais tarde." });
      }
      const [users] = await connection.execute(
        "SELECT id,email,name,role,password_hash FROM users WHERE email=? AND active=1 LIMIT 1",
        [normalized],
      );
      const user = users[0];
      const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
      if (!valid) {
        const freshWindow = Boolean(attempt.fresh_window);
        const failures = freshWindow ? 1 : attempt.failures + 1;
        await connection.execute(
          "UPDATE login_attempts SET failures=?,window_started=IF(?,UTC_TIMESTAMP(),window_started),locked_until=IF(? >= 5,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE),NULL) WHERE attempt_key=?",
          [failures, freshWindow, failures, key],
        );
        await connection.commit();
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }
      await connection.execute("DELETE FROM login_attempts WHERE attempt_key=?", [key]);
      const token = newToken();
      await connection.execute(
        "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? DAY))",
        [tokenDigest(config.sessionSecret, token), user.id, SESSION_DAYS],
      );
      await connection.commit();
      res.setHeader("Set-Cookie", cookieValue(token, secure));
      res.json({ user: publicUser(user) });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = /(?:^|;\s*)xhaka_session=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
    if (token)
      await pool.execute("DELETE FROM sessions WHERE token_hash=?", [
        tokenDigest(config.sessionSecret, token),
      ]);
    res.setHeader("Set-Cookie", clearCookie(secure));
    res.status(204).end();
  });

  app.get("/api/users", requireRole("admin"), async (_req, res) => {
    const [rows] = await pool.execute(
      "SELECT id,email,name,role,active,created_at FROM users ORDER BY id",
    );
    res.json({
      users: rows.map((row) => ({
        ...publicUser(row),
        active: Boolean(row.active),
        createdAt: row.created_at,
      })),
    });
  });
  app.post("/api/users", requireRole("admin"), async (req, res) => {
    const user = parseBody(userSchema, req.body);
    const passwordHash = await hashPassword(user.password);
    const [result] = await pool.execute(
      "INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)",
      [user.email.trim().toLowerCase(), user.name, passwordHash, user.role],
    );
    res.status(201).json({
      user: {
        id: String(result.insertId),
        email: user.email.trim().toLowerCase(),
        name: user.name,
        role: user.role,
      },
    });
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Entre para continuar." });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Acesso não autorizado." });
    next();
  };
}
