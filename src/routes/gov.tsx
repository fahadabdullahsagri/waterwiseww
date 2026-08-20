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
import { SiteFooter } from "@/components/site-footer";
import { Download } from "lucide-react";
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

  function download(kind: "nrw" | "audit") {
    const rows =
      kind === "nrw"
        ? [
            ["month", "nrw_percent", "litres_saved_thousands"],
            ...nrw.map((r) => [r.month, String(r.nrw), String(r.saved)]),
          ]
        : [
            ["timestamp", "agent", "trigger", "decision", "confidence", "approval_status", "approved_by"],
            ...events.map((e) => [
              String(e.created_at ?? ""),
              String(e.agent ?? ""),
              String(e.trigger ?? ""),
              String(e.decision ?? ""),
              String(e.confidence ?? ""),
              String(e.approval_status ?? ""),
              String((e as { approved_by?: string }).approved_by ?? ""),
            ]),
          ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `waterwise-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
        <div className="border-y border-hair py-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            WaterWise · Municipal water report
          </div>
          <h1 className="mt-3 text-3xl font-semibold">Government &amp; utility oversight</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every number here is reproducible from the audit trail below — no black-box scores.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-[11px] text-muted-foreground">
              Prepared {new Date().toISOString().slice(0, 10)} · Demo city · 6 wards
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => download("nrw")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Export NRW series (CSV)
              </button>
              <button
                onClick={() => download("audit")}
                className="inline-flex items-center gap-2 rounded-lg border border-hair bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Export audit trail (CSV)
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Card label="Current NRW" value={latest ? `${latest.nrw}%` : "–"} />
          <Card label="Reduction over 12 months" value={`${delta} pp`} tone="good" />
          <Card label="Benchmark (CPHEEO)" value="15%" />
          <Card label="Agent actions on record" value={`${events.length} (${approved} approved)`} />
        </div>

        <section className="mt-4 rounded-2xl border border-hair bg-card p-4">
          <h2 className="text-sm font-semibold"><span className="font-mono text-muted-foreground">1. </span>Non-revenue water — 12-month trend</h2>
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

        <section className="mt-4 overflow-hidden rounded-2xl border border-hair bg-card">
          <h2 className="border-b border-hair px-4 py-3 text-sm font-semibold">
            <span className="font-mono text-muted-foreground">2. </span>Scheme alignment & evidence produced
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
                <tr key={s.name} className="border-t border-hair align-top">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.line}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-hair bg-card">
          <h2 className="border-b border-hair px-4 py-3 text-sm font-semibold">
            <span className="font-mono text-muted-foreground">3. </span>Audit trail — every agent decision on record
          </h2>
          {events.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No agent decisions recorded yet. Open the operator control room to run the network.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Timestamp (UTC)</th>
                    <th className="px-4 py-2">Agent</th>
                    <th className="px-4 py-2">Decision</th>
                    <th className="px-4 py-2">Confidence</th>
                    <th className="px-4 py-2">Gate</th>
                    <th className="px-4 py-2">Approving officer</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 25).map((e) => (
                    <tr key={e.id} className="border-t border-hair align-top">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {String(e.created_at ?? "").slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs uppercase">{e.agent}</td>
                      <td className="px-4 py-3">{e.trigger}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {Math.round(Number(e.confidence ?? 0) * 100)}%
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.requires_human_approval ? e.approval_status : "auto"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(e as { approved_by?: string | null }).approved_by ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-hair bg-card p-5 text-sm">
          <h2 className="text-sm font-semibold"><span className="font-mono text-muted-foreground">4. </span>Data sovereignty &amp; procurement posture</h2>
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
  tone?: "default" | "good";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        tone === "good" ? "border-primary/40 bg-primary/5" : "border-hair bg-card"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
