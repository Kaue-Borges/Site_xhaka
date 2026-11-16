export function readConfig(env = process.env) {
  const required = ["DB_NAME", "DB_USER", "DB_PASSWORD", "SESSION_SECRET"];
  for (const key of required) if (!env[key]) throw new Error(`${key} é obrigatório no servidor.`);
  if (env.SESSION_SECRET.length < 32)
    throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  const port = Number(env.PORT ?? 3001);
  const dbPort = Number(env.DB_PORT ?? 3306);
  const nodeEnv = env.NODE_ENV ?? "production";
  if (!["development", "production"].includes(nodeEnv))
    throw new Error("NODE_ENV deve ser development ou production.");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT inválida.");
  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535)
    throw new Error("DB_PORT inválida.");
  return {
    nodeEnv,
    port,
    db: {
      host: env.DB_HOST ?? "127.0.0.1",
      port: dbPort,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    },
    sessionSecret: env.SESSION_SECRET,
  };
}
