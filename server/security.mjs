import { randomBytes, createHmac, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const params = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, params);
  return `scrypt$${params.N}$${params.r}$${params.p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, salt, expected] = encoded.split("$");
    if (algorithm !== "scrypt") return false;
    const expectedBytes = Buffer.from(expected, "base64url");
    const actual = await scrypt(password, Buffer.from(salt, "base64url"), expectedBytes.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
  } catch {
    return false;
  }
}

export const newToken = () => randomBytes(32).toString("base64url");
export const tokenDigest = (secret, value) => createHmac("sha256", secret).update(value).digest();
export const publicUser = (user) => ({
  id: String(user.id),
  email: user.email,
  name: user.name,
  role: user.role,
});

export function cookieValue(token, secure) {
  return `xhaka_session=${token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=604800${secure ? "; Secure" : ""}`;
}
export function clearCookie(secure) {
  return `xhaka_session=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
