export type Absorption = {
  soilMoisture: number;
  rain24h: number;
  temperature: number;
  storageMm: number;
  capacity: "low" | "moderate" | "high";
  advice: string;
  /** Coarse soil-quality read derived from how the ground is holding water right now. */
  soilQuality: {
    label: string;
    infiltrationMmPerHour: number;
    holdsWater: "poorly" | "moderately" | "well";
    note: string;
  };
  /** What this ground actually needs today, and what over-watering costs. */
  plan: {
    areaSqm: number;
    recommendedLitres: number;
    typicalLitres: number;
    excessLitres: number;
    excessPct: number;
    runoffRiskPct: number;
    verdict: "under" | "normal" | "over";
    conservationImpact: string;
  };
};

/**
 * A 250 m soil-storage proxy from Open-Meteo (keyless): how much more water the
 * ground can hold right now, what kind of soil it behaves like, and how much
 * watering that ground can actually absorb before the rest is wasted.
 */
export async function absorptionEstimate(
  lat: number,
  lng: number,
  areaSqm = 50,
): Promise<Absorption> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}` +
    `&current=temperature_2m,precipitation,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm` +
    `&daily=precipitation_sum,et0_fao_evapotranspiration&past_days=1&forecast_days=1&timezone=UTC`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("open-meteo " + res.status);
  const json = (await res.json()) as any;

  const shallow = Number(json?.current?.soil_moisture_0_to_1cm ?? 0.2);
  const deep = Number(json?.current?.soil_moisture_3_to_9cm ?? shallow);
  const soilMoisture = Math.max(0, Math.min(0.6, (shallow + deep) / 2));
  const rain24h = Number(json?.daily?.precipitation_sum?.[0] ?? 0);
  const temperature = Number(json?.current?.temperature_2m ?? 0);
  const et0 = Math.max(1, Number(json?.daily?.et0_fao_evapotranspiration?.[0] ?? 3.5));

  // Saturation is treated as 0.45 m³/m³; 90 mm of usable depth in the top 9 cm.
  const headroom = Math.max(0, 0.45 - soilMoisture) / 0.45;
  const storageMm = Math.round(headroom * 90 * 10) / 10;

  const capacity: Absorption["capacity"] =
    headroom > 0.6 ? "high" : headroom > 0.3 ? "moderate" : "low";

  // Soil-quality proxy: how fast the surface dries relative to the deeper layer.
  const drainage = deep > 0 ? shallow / deep : 1;
  const soilQuality =
    drainage < 0.85
      ? {
          label: "Sandy / free-draining",
          infiltrationMmPerHour: 25,
          holdsWater: "poorly" as const,
          note: "Water sinks fast but leaves quickly too — short, frequent watering beats one long soak.",
        }
      : drainage > 1.15
        ? {
            label: "Clay-heavy / slow-draining",
            infiltrationMmPerHour: 5,
            holdsWater: "well" as const,
            note: "The surface stays wet while deeper layers lag — pour slowly or most of it runs off the top.",
          }
        : {
            label: "Loamy / balanced",
            infiltrationMmPerHour: 13,
            holdsWater: "moderately" as const,
            note: "Good structure: it takes water at a steady rate and holds it in the root zone.",
          };

  // Today's actual need: crop demand minus rain, capped by what the ground can still store.
  const area = Math.max(1, Math.min(5000, areaSqm));
  const needMm = Math.max(0, Math.min(et0 - rain24h, storageMm));
  const recommendedLitres = Math.round(needMm * area);
  // What a household typically puts on: a hose run sized by habit, not by soil.
  const typicalLitres = Math.round(6 * area);
  const excessLitres = Math.max(0, typicalLitres - recommendedLitres);
  const excessPct =
    recommendedLitres > 0 ? Math.round((excessLitres / recommendedLitres) * 100) : 100;
  const runoffRiskPct = Math.round(Math.min(95, (1 - headroom) * 100));

  const verdict: Absorption["plan"]["verdict"] =
    excessLitres <= 0 ? "under" : excessPct > 40 ? "over" : "normal";

  const conservationImpact =
    recommendedLitres === 0
      ? `This ground needs nothing today${rain24h > 1 ? ` — ${rain24h.toFixed(1)} mm of rain already did the job` : ""}. A normal watering run would add about ${typicalLitres.toLocaleString()} L that the soil cannot take: it runs straight off, carries fertiliser into drains and spends treated water the network is already losing to leaks. Skipping today alone saves ${typicalLitres.toLocaleString()} L.`
      : verdict === "over"
      ? `Watering as usual puts about ${excessLitres.toLocaleString()} L more than this ground can absorb — roughly ${excessPct}% over need, or ${(excessLitres * 7).toLocaleString()} L a week. That surplus does not reach the roots: it runs off, carries fertiliser into drains and pushes demand onto a supply the network is already losing to leaks.`
      : verdict === "normal"
        ? `Watering as usual adds about ${excessLitres.toLocaleString()} L over the ${recommendedLitres.toLocaleString()} L this soil needs today. Trimming that back is a painless ${(excessLitres * 30).toLocaleString()} L saved a month.`
        : `Today's need of ${recommendedLitres.toLocaleString()} L is at or above a normal hose run, so watering here is genuinely useful — just do it once, early, and let it soak in.`;

  const advice =
    capacity === "low"
      ? `The ground is already near saturation${rain24h > 1 ? ` after ${rain24h.toFixed(1)} mm of rain` : ""}. Skip watering today — anything you add runs off.`
      : capacity === "moderate"
        ? `The soil can still take about ${storageMm} mm. Water once, in the early morning, and stop there.`
        : `Dry ground with room for roughly ${storageMm} mm. Water deeply and less often so it soaks past the surface at ${temperature.toFixed(0)}°C.`;

  return {
    soilMoisture,
    rain24h,
    temperature,
    storageMm,
    capacity,
    advice,
    soilQuality,
    plan: {
      areaSqm: area,
      recommendedLitres,
      typicalLitres,
      excessLitres,
      excessPct,
      runoffRiskPct,
      verdict,
      conservationImpact,
    },
  };
}
