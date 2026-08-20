import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const idSchema = z.object({ householdId: z.string().min(8).max(64) });

const addSchema = z.object({
  householdId: z.string().min(8).max(64),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  litres: z.number().int().min(1).max(200000),
  category: z.enum(["household", "garden", "livestock", "other"]),
  note: z.string().max(300).optional(),
  isDemo: z.boolean().optional(),
});

export const listHouseholdEntries = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    const { admin } = await import("./waterwise.server");
    const { data: rows } = await admin()
      .from("household_entries")
      .select("id,entry_date,litres,category,note,is_demo")
      .eq("household_id", data.householdId)
      .order("entry_date", { ascending: true })
      .limit(400);
    return rows ?? [];
  });

export const addHouseholdEntry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => addSchema.parse(d))
  .handler(async ({ data }) => {
    const { admin } = await import("./waterwise.server");
    const { error } = await admin().from("household_entries").insert({
      household_id: data.householdId,
      entry_date: data.entryDate,
      litres: data.litres,
      category: data.category,
      note: data.note ?? null,
      is_demo: data.isDemo ?? false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Seed two weeks of believable household history so a first-time visitor sees a trend. */
export const seedHouseholdHistory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    const { admin, seeded } = await import("./waterwise.server");
    const sb = admin();
    const { count } = await sb
      .from("household_entries")
      .select("id", { count: "exact", head: true })
      .eq("household_id", data.householdId);
    if ((count ?? 0) > 0) return { seeded: false };

    const rand = seeded(7);
    const rows = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (13 - i));
      return {
        household_id: data.householdId,
        entry_date: d.toISOString().slice(0, 10),
        litres: Math.round(690 + rand() * 260),
        category: "household",
        is_demo: true,
      };
    });
    const { error } = await sb.from("household_entries").insert(rows);
    if (error) throw new Error(error.message);
    return { seeded: true };
  });

/**
 * Soil-storage proxy for a watering plan: live weather + soil moisture from Open-Meteo.
 * No key, no stored coordinates — the point is rounded before it leaves the browser.
 */
export const estimateAbsorption = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        areaSqm: z.number().min(1).max(5000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { absorptionEstimate } = await import("./household.server");
    return absorptionEstimate(data.lat, data.lng, data.areaSqm ?? 50);
  });

