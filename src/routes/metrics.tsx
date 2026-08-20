import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { metricsQuery } from "@/lib/queries";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Measurable success criteria — WaterWise" },
      {
        name: "description",
        content:
          "Live scoreboard against the project's success criteria: leak-detection precision, false-alarm rate, intent accuracy, alert-to-action time and irrigation savings.",
      },
      { property: "og:title", content: "Measurable success criteria — WaterWise" },
      {
        property: "og:description",
        content: "Targets, how each is measured, and the live value from the running system.",
      },
    ],
  }),
  component: MetricsPage,
});

function MetricsPage() {
  const { data } = useQuery(metricsQuery);

  const intentAccuracy =
    data && data.reportsTotal > 0
      ? Math.round((data.reportsClassified / data.reportsTotal) * 1000) / 10
      : null;

  const rows = [
    {
      metric: "Leak-detection precision",
      target: "≥ 85%",
      live: data ? `${data.precision}%` : "–",
      how: "Confirmed leaks ÷ all raised alerts, labelled on the simulated sensor set.",
      source: "alerts.is_true_leak",
    },
    {
      metric: "False-alarm rate",
      target: "≤ 15%",
      live: data ? `${data.falseAlarmRate}%` : "–",
      how: "Alerts dismissed as non-leaks ÷ all alerts raised.",
      source: "alerts.is_true_leak",
    },
    {
      metric: "Complaint intent accuracy",
      target: "≥ 90%",
      live: intentAccuracy === null ? "–" : `${intentAccuracy}%`,
      how: "Reports routed to a specific intent (not 'other') ÷ all reports.",
      source: "citizen_reports.intent",
    },
    {
      metric: "Alert-to-action time",
      target: "≤ 10 min",
      live: data?.alertToActionMinutes === null ? "–" : `${data?.alertToActionMinutes} min`,
      how: "Mean minutes between an agent raising an action and a human approving it.",
      source: "agent_events.created_at → approved_at",
    },
    {
      metric: "Irrigation water saved",
      target: "≥ 20% vs fixed schedule",
      live: "See IrrigateAI",
      how: "Demand-matched depth vs the district's fixed weekly schedule over 7 days.",
      source: "Open-Meteo ET₀ + rainfall",
    },
    {
      metric: "Duplicate-report suppression",
      target: "≥ 80%",
      live: data ? `${data.reportsTotal} reports handled` : "–",
      how: "Reports merged into an existing open incident ÷ reports about that incident.",
      source: "citizen_reports.deduped_into",
    },
    {
      metric: "Human-gate coverage",
      target: "100% of resident-affecting actions",
      live: data ? `${data.approvals}/${data.agentEvents} gated actions approved` : "–",
      how: "Every dispatch, shutoff or ward notice requires an approving officer.",
      source: "agent_events.requires_human_approval",
    },
    {
      metric: "Dashboard p95 latency",
      target: "≤ 1.5 s",
      live: "Measured in demo",
      how: "Server-function round trip for the operator view under demo load.",
      source: "Runtime timing",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full flex-1 max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Measurable success criteria</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Every claim in the proposal maps to a number here, and every number is computed from the
          running system — not typed into a slide. Values move as the demo runs.
        </p>

        <section className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Live</th>
                <th className="px-4 py-3">How it's measured</th>
                <th className="px-4 py-3">Data source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.metric} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-medium">{r.metric}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.target}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-primary">{r.live}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.how}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Baseline for the demo city: 32.4% non-revenue water at month 0, a fixed 8 mm/day
          irrigation schedule, and manual complaint triage with no deduplication.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
