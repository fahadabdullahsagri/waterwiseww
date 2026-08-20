import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { AgentTrace, type AgentEvent } from "@/components/agent-trace";
import { irrigationQuery } from "@/lib/queries";

export const Route = createFileRoute("/irrigate")({
  head: () => ({
    meta: [
      { title: "IrrigateAI — demand-matched irrigation plan — WaterWise" },
      {
        name: "description",
        content:
          "A 7-day irrigation target computed from live Open-Meteo forecasts and NASA POWER evapotranspiration, compared against a fixed-schedule baseline.",
      },
      { property: "og:title", content: "IrrigateAI — demand-matched irrigation plan" },
      {
        property: "og:description",
        content: "Live weather and evapotranspiration turned into litres of irrigation saved.",
      },
    ],
  }),
  component: IrrigatePage,
});

function IrrigatePage() {
  const [districtId, setDistrictId] = useState<string | undefined>();
  const { data, isLoading } = useQuery(irrigationQuery(districtId));

  const summary = data?.summary;
  const chart = (data?.plan ?? []).map((p) => ({
    date: p.date.slice(5),
    Recommended: p.target_mm,
    "Fixed schedule": p.baseline_mm,
    Rain: p.rain_mm,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full flex-1 max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">IrrigateAI</h1>
            <p className="text-sm text-muted-foreground">
              Live Open-Meteo forecast + NASA POWER solar/ET data — both keyless, both real.
            </p>
          </div>
          <select
            value={districtId ?? (data?.district?.id as string) ?? ""}
            onChange={(e) => setDistrictId(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {(data?.districts ?? []).map((d) => (
              <option key={d.id as string} value={d.id as string}>
                {d.name as string} · {d.crop as string}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Fetching live weather data…</p>
        )}

        {summary && (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Card
                label="7-day rain forecast"
                value={`${summary.weekRain} mm`}
                tone={summary.drought ? "warn" : "default"}
              />
              <Card label="Recommended total" value={`${summary.totalTarget} mm`} />
              <Card label="Fixed-schedule total" value={`${summary.totalBaseline} mm`} />
              <Card label="Water saved" value={`${summary.savedPercent}%`} tone="good" />
            </div>

            {summary.drought && (
              <p className="mt-4 rounded-xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
                <strong>Drought signal raised.</strong> With under 5 mm of rain forecast, IrrigateAI
                asks LeakSense to weight network losses higher — every litre lost in the mains costs
                more this week.
              </p>
            )}

            <section className="mt-4 rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">
                Daily irrigation depth — recommended vs fixed schedule
              </h2>
              <div className="mt-3 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="mm" />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="Fixed schedule" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Recommended" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rain" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Data sources in this view</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Open-Meteo</strong> — 7-day rainfall and
                    reference evapotranspiration (ET₀). No API key, no signup.
                  </li>
                  <li>
                    <strong className="text-foreground">NASA POWER</strong> — solar irradiance{" "}
                    {data?.power?.avgSolar ? `(${data.power.avgSolar} kWh/m²/day mean)` : ""} and
                    temperature.{" "}
                    {data?.power?.live ? "Live response." : "Cached fallback in use right now."}
                  </li>
                  <li>
                    <strong className="text-foreground">Crop coefficient</strong> — applied to ET₀,
                    minus 80% of effective rainfall, capped at the district's existing fixed
                    schedule.
                  </li>
                </ul>
              </section>

              {data?.agent && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold">Agentrix trace</h2>
                  <AgentTrace event={data.agent as unknown as AgentEvent} defaultOpen />
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn" | "good";
}) {
  const cls =
    tone === "warn"
      ? "border-warning/50 bg-warning/10"
      : tone === "good"
        ? "border-primary/40 bg-primary/5"
        : "border-border bg-card";
  return (
    <div className={`rounded-2xl border px-4 py-3 ${cls}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
