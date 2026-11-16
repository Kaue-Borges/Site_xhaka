import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalDate = isoDate.optional().or(z.literal(""));
const text = (max) => z.string().max(max).optional();
export const idSchema = z.string().regex(/^\d{7}$/);
export const uuidSchema = z.string().uuid();
export const roleSchema = z.enum(["admin", "editor", "viewer"]);
export const loginSchema = z
  .object({ email: z.string().email().max(254), password: z.string().min(1).max(1024) })
  .strict();
export const userSchema = z
  .object({
    email: z.string().email().max(254),
    name: z.string().trim().min(1).max(120),
    password: z.string().min(12).max(1024),
    role: roleSchema,
  })
  .strict();
export const citySchema = z
  .object({
    status: z.enum(["none", "planned", "prep", "recording", "done", "cancelled"]),
    plannedDate: optionalDate,
    recordedDate: optionalDate,
    description: text(10000),
    notes: text(20000),
    videoUrl: text(2048),
    instagramUrl: text(2048),
    tiktokUrl: text(2048),
    restaurants: text(10000),
    hotels: text(10000),
    locations: text(10000),
    attractions: text(10000),
    contacts: text(10000),
    checklist: z
      .array(
        z
          .object({
            id: z.string().min(1).max(36),
            label: z.string().min(1).max(255),
            done: z.boolean(),
          })
          .strict(),
      )
      .max(100),
    history: z
      .array(
        z
          .object({
            id: uuidSchema,
            ts: z.number().int().nonnegative(),
            text: z.string().min(1).max(500),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();
export const routeSchema = z
  .object({
    id: uuidSchema,
    name: z.string().trim().min(1).max(120),
    cityIds: z.array(idSchema).max(295),
  })
  .strict();
export const metaSchema = z
  .object({
    startDate: isoDate,
    manualKm: z.number().min(0).max(100000000),
    nextRecording: optionalDate,
  })
  .strict();

export function parseBody(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("Dados inválidos.");
    error.status = 400;
    error.details = parsed.error.flatten();
    throw error;
  }
  return parsed.data;
}
