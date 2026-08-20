export type Absorption = {
  soilMoisture: number;
  rain24h: number;
  temperature: number;
  storageMm: number;
  capacity: "low" | "moderate" | "high";
  advice: string;
};

/**
 * A 250 m soil-storage proxy from Open-Meteo (keyless): how much more water the
 * ground can hold right now, and whether watering today is worth it.
 */
export async function absorptionEstimate(lat: number, lng: number): Promise<Absorption> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}` +
    `&current=temperature_2m,precipitation,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm` +
    `&daily=precipitation_sum&past_days=1&forecast_days=1&timezone=UTC`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("open-meteo " + res.status);
  const json = (await res.json()) as any;

  const shallow = Number(json?.current?.soil_moisture_0_to_1cm ?? 0.2);
  const deep = Number(json?.current?.soil_moisture_3_to_9cm ?? shallow);
  const soilMoisture = Math.max(0, Math.min(0.6, (shallow + deep) / 2));
  const rain24h = Number(json?.daily?.precipitation_sum?.[0] ?? 0);
  const temperature = Number(json?.current?.temperature_2m ?? 0);

  // Saturation is treated as 0.45 m³/m³; 90 mm of usable depth in the top 9 cm.
  const headroom = Math.max(0, 0.45 - soilMoisture) / 0.45;
  const storageMm = Math.round(headroom * 90 * 10) / 10;

  const capacity: Absorption["capacity"] =
    headroom > 0.6 ? "high" : headroom > 0.3 ? "moderate" : "low";

  const advice =
    capacity === "low"
      ? `The ground is already near saturation${rain24h > 1 ? ` after ${rain24h.toFixed(1)} mm of rain` : ""}. Skip watering today — anything you add runs off.`
      : capacity === "moderate"
        ? `The soil can still take about ${storageMm} mm. Water once, in the early morning, and stop there.`
        : `Dry ground with room for roughly ${storageMm} mm. Water deeply and less often so it soaks past the surface at ${temperature.toFixed(0)}°C.`;

  return { soilMoisture, rain24h, temperature, storageMm, capacity, advice };
}
