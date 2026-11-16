import { hashPassword } from "./security.mjs";
import { userSchema } from "./validation.mjs";
import { readHidden } from "./read-hidden.mjs";

const email = process.argv[2]?.trim().toLowerCase();
const name = process.argv[3]?.trim();
if (!email || !name) throw new Error("Uso: npm run user:first-sql -- email@dominio.com 'Nome'");
const password = await readHidden("Senha inicial (mínimo 12 caracteres): ");
if (password !== (await readHidden("Confirme a senha: ")))
  throw new Error("As senhas não coincidem.");
const user = userSchema.parse({ email, name, password, role: "admin" });
const hash = await hashPassword(user.password);
const hex = (value) => `CONVERT(0x${Buffer.from(value, "utf8").toString("hex")} USING utf8mb4)`;
console.log(
  `INSERT INTO users (email,name,password_hash,role) SELECT ${hex(user.email)},${hex(user.name)},${hex(hash)},'admin' WHERE NOT EXISTS (SELECT 1 FROM users);`,
);
console.log("Cole a instrução acima no phpMyAdmin uma única vez. Não a salve no repositório.");
