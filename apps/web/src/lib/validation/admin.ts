import { normalizePhone } from "@mohar/core";
import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).optional();

export const citySchema = z.object({
  code: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{3}$/, "Use exactly 3 letters, e.g. SIR")),
  name: z.string().min(2, "Enter the city name").max(60),
  name_pa: optionalText(60),
  slug: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(
      z
        .string()
        .regex(/^[a-z][a-z0-9-]{1,30}$/, "Lower-case letters, digits and hyphens, e.g. sirhind"),
    ),
  state: z.string().min(2).max(60).default("Punjab"),
  is_live: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Enter at least 2 characters").max(60),
  name_pa: optionalText(60),
});

const coordinate = (min: number, max: number) => z.coerce.number().min(min).max(max).optional();

export const businessSchema = z
  .object({
    name: z.string().min(2, "Enter the business name").max(120),
    city_id: z.uuid("Choose a city"),
    category_id: z.uuid("Choose a category"),
    scope: z.enum(["city", "national"], "Choose city or national"),
    address: z.string().min(5, "Enter the full address").max(300),
    gstin: z
      .string()
      .transform((v) => v.toUpperCase().replace(/\s+/g, ""))
      .pipe(z.string().regex(/^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]Z[0-9A-Z]$/, "Not a valid GSTIN"))
      .optional(),
    lat: coordinate(-90, 90),
    lng: coordinate(-180, 180),
    phone: z
      .string()
      .transform((v, ctx) => {
        const e164 = normalizePhone(v);
        if (!e164) {
          ctx.addIssue({ code: "custom", message: "Not a valid phone number" });
          return z.NEVER;
        }
        return e164;
      })
      .optional(),
    hours: optionalText(200),
    logo_url: z.url({ protocol: /^https$/, message: "Use an https:// link" }).optional(),
    issuance_cap_per_quarter: z.coerce.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((b) => (b.lat === undefined) === (b.lng === undefined), {
    message: "Enter both latitude and longitude, or neither",
    path: ["lng"],
  });

export type BusinessInput = z.infer<typeof businessSchema>;

/** Columns to write. Optional fields left blank are stored as null. City is set only on create. */
export function businessRow(input: BusinessInput) {
  return {
    name: input.name,
    category_id: input.category_id,
    scope: input.scope,
    address: input.address,
    gstin: input.gstin ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    phone: input.phone ?? null,
    hours: input.hours ?? null,
    logo_url: input.logo_url ?? null,
    issuance_cap_per_quarter: input.issuance_cap_per_quarter ?? null,
  };
}

export const staffInviteSchema = z.object({
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase()),
  role: z.enum(["owner", "cashier"]),
});

export const businessStatusSchema = z.enum(["active", "suspended", "left"]);
