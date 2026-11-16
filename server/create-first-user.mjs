import { readConfig } from "./config.mjs";
import { createPool } from "./db.mjs";
import { hashPassword } from "./security.mjs";
import { userSchema } from "./validation.mjs";
import { readHidden } from "./read-hidden.mjs";

const email = process.argv[2]?.trim().toLowerCase();
const name = process.argv[3]?.trim();
if (!email || !name)
  throw new Error(
    "Uso: npm run user:first -- email@dominio.com 'Nome' (senha solicitada no terminal)",
  );
const password = await readHidden("Senha inicial (mínimo 12 caracteres): ");
const confirmation = await readHidden("Confirme a senha: ");
if (password !== confirmation) throw new Error("As senhas não coincidem.");
const parsed = userSchema.parse({ email, name, password, role: "admin" });
const pool = createPool(readConfig().db);
try {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT id FROM users LIMIT 1 FOR UPDATE");
    if (rows.length)
      throw new Error("Já existe um usuário; crie outros pela API com uma sessão admin.");
    await connection.execute("INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)", [
      parsed.email,
      parsed.name,
      await hashPassword(parsed.password),
      "admin",
    ]);
    await connection.commit();
    console.log("Primeiro administrador criado.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}
