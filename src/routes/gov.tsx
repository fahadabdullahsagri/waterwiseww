import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SiteNav } from "@/components/site-nav";
import { govQuery } from "@/lib/queries";

export const Route = createFileRoute("/gov")({
  head: () => ({
    meta: [
      { title: "Government dashboard — NRW & scheme compliance — WaterWise" },
      {
        name: "description",
        content:
          "Non-revenue water trend against the 15% service-level benchmark, plus how WaterWise evidence maps to Jal Jeevan Mission, AMRUT 2.0 and Atal Bhujal reporting.",
      },
      { property: "og:title", content: "Government dashboard — WaterWise" },
      {
        property: "og:description",
        content: "NRW trend, audit trail and scheme alignment for municipal reviewers.",
      },
    ],
  }),
  component: GovPage,
});

const schemes = [
  {
    name: "Jal Jeevan Mission",
    line: "Functional Household Tap Connection service levels",
    evidence:
      "Per-ward supply-continuity hours and outage minutes, exportable monthly as a signed CSV.",
  },
  {
    name: "AMRUT 2.0",
    line: "Water-supply universal coverage & NRW reduction",
    evidence:
      "Non-revenue-water percentage with month-on-month delta and the repair actions that drove it.",
  },
  {
    name: "Atal Bhujal Yojana",
    line: "Groundwater demand-side management",
    evidence:
      "Irrigation depth recommended vs fixed schedule, converted to groundwater abstraction avoided.",
  },
  {
    name: "CPHEEO service-level benchmark",
    line: "NRW ceiling of 15%",
    evidence: "Trend line with the 15% benchmark drawn on the chart, and time-to-breach forecast.",
  },
];

function GovPage() {
  const { data } = useQuery(govQuery);
  const nrw = (data?.nrw ?? []).map((r) => ({
    month: String(r.month).slice(0, 7),
    nrw: Number(r.nrw_percent),
    saved: Math.round(Number(r.litres_saved ?? 0) / 1000),
  }));
  const latest = nrw.at(-1);
  const first = nrw[0];
  const delta = latest && first ? Math.round((first.nrw - latest.nrw) * 10) / 10 : 0;
  const events = data?.events ?? [];
  const approved = events.filter((e) => e.approval_status === "approved").length;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Government & utility oversight</h1>
        <p className="text-sm text-muted-foreground">
          Every number here is reproducible from the audit trail below — no black-box scores.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Card label="Current NRW" value={latest ? `${latest.nrw}%` : "–"} />
          <Card label="Reduction over 12 months" value={`${delta} pp`} tone="good" />
          <Card label="Benchmark (CPHEEO)" value="15%" />
          <Card label="Agent actions on record" value={`${events.length} (${approved} approved)`} />
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Non-revenue water — 12-month trend</h2>
          <div className="mt-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={nrw}>
                <defs>
                  <linearGradient id="nrwFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, "auto"]} />
                <RTooltip />
                <ReferenceLine
                  y={15}
                  stroke="var(--chart-4)"
                  strokeDasharray="4 4"
                  label={{ value: "15% benchmark", fontSize: 11, position: "insideTopRight" }}
                />
                <Area
                  type="monotone"
                  dataKey="nrw"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#nrwFill)"
                  name="NRW %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
            Scheme alignment & evidence produced
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Scheme</th>
                <th className="px-4 py-2">Reporting line</th>
                <th className="px-4 py-2">Evidence WaterWise produces</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((s) => (
                <tr key={s.name} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.line}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-5 text-sm">
          <h2 className="text-sm font-semibold">Data sovereignty & procurement posture</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              All operational data stays in the utility's own database instance; the agent layer
              reads and writes through auditable server functions only.
            </li>
            <li>
              Every agent decision is stored with its inputs, reasoning summary, confidence and
              approving officer — a complete audit trail for a CAG-style review.
            </li>
            <li>
              Actions that affect residents (supply shutoff, ward notices, crew dispatch) are gated
              on human approval by design; the agent never acts alone on those.
            </li>
            <li>
              Weather and evapotranspiration come from open public sources, so no proprietary data
              licence is embedded in the procurement.
            </li>
          </ul>
        </section>
      </main>
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
  tone?: "default" | "good";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        tone === "good" ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
