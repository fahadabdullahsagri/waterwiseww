import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How the Agentrix engine works — WaterWise" },
      {
        name: "description",
        content:
          "The four WaterWise agents, their trigger-perception-reasoning-action-memory loops, the free public data they run on, and where a human must approve before anything reaches a resident.",
      },
      { property: "og:title", content: "How the Agentrix engine works — WaterWise" },
      {
        property: "og:description",
        content:
          "Four agents, one shared memory, a human gate on every resident-affecting action, and only free public data sources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const agents = [
  {
    name: "LeakSense",
    role: "Finds the loss before the street floods",
    trigger: "Sensor reading batch arrives, or a district-metered-area balance drifts.",
    perception: "Flow, pressure and acoustic score per sensor, plus pipe age and diameter.",
    reasoning:
      "Correlates a pressure drop with a rising acoustic score across neighbouring sensors, estimates litres per hour and scores confidence against known burst history.",
    action: "Raises a ranked incident and drafts a crew work order.",
    memory: "Stores the reading window and the score so a later dismissal retrains the threshold.",
    gate: "Crew dispatch needs an approving officer.",
  },
  {
    name: "JalConnect",
    role: "Turns complaints into one incident, not fifty tickets",
    trigger: "A resident sends a chat, SMS or IVR report.",
    perception: "Free-text message, ward, and any open incident within the same street.",
    reasoning:
      "Classifies intent, deduplicates against open incidents, and writes a plain-language ETA the resident can actually use.",
    action: "Merges the report, replies to the resident, notifies the ward.",
    memory: "Links the report to the incident so repeat reports raise its priority, not its count.",
    gate: "Ward-wide notices need an approving officer.",
  },
  {
    name: "IrrigateAI",
    role: "Stops irrigating on a calendar instead of the weather",
    trigger: "Daily schedule, plus any rainfall forecast change above threshold.",
    perception: "Open-Meteo forecast and NASA POWER evapotranspiration for the district.",
    reasoning:
      "Computes demand-matched depth from ET₀ minus effective rainfall and compares it to the fixed weekly schedule.",
    action: "Publishes a seven-day irrigation plan with litres avoided.",
    memory: "Caches the last good forecast so a source outage degrades to the fixed schedule.",
    gate: "Auto — advisory only, no resident-affecting action.",
  },
  {
    name: "GovDash",
    role: "Makes the evidence reviewable, not just presentable",
    trigger: "Any repair confirmed, or the month rolls over.",
    perception: "Confirmed repairs, litres recovered, supply-continuity hours per ward.",
    reasoning:
      "Recomputes non-revenue water and maps each movement to the repair actions that caused it.",
    action: "Updates the trend, writes the audit row, exports scheme-ready CSV.",
    memory: "Every number keeps the inputs that produced it for a CAG-style reconstruction.",
    gate: "Auto — reporting only; the underlying actions were already gated.",
  },
];

const sources = [
  ["Open-Meteo forecast API", "Rainfall, temperature and ET₀ for the next seven days", "Free, no key, no rate-limit tier needed"],
  ["NASA POWER", "Historical evapotranspiration and solar radiation baselines", "Free, public, no key"],
  ["OpenStreetMap tiles", "Network and incident map", "Free, attributed on the map"],
  ["Utility SCADA / DMA logs", "Flow, pressure and acoustic readings", "Simulated in the demo; ingested from the utility in a pilot"],
];

function HowItWorks() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="font-display text-3xl font-semibold">How the Agentrix engine works</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Four agents share one memory and one rule: anything that reaches a resident stops at a
          human first. Each loop below runs on the live system — the operator trace shows it
          happening.
        </p>

        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {agents.map((a, i) => (
            <li key={a.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/12 font-mono text-xs text-primary">
                  {i + 1}
                </span>
                <h2 className="font-display text-lg font-semibold">{a.name}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.role}</p>
              <dl className="mt-4 space-y-2 text-sm">
                {[
                  ["Trigger", a.trigger],
                  ["Perception", a.perception],
                  ["Reasoning", a.reasoning],
                  ["Action", a.action],
                  ["Memory", a.memory],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 sm:grid-cols-[86px_1fr] sm:gap-3">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {k}
                    </dt>
                    <dd className="text-muted-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 rounded-lg border border-hair bg-muted/40 px-3 py-2 text-xs">
                <strong>Human gate:</strong> {a.gate}
              </p>
            </li>
          ))}
        </ol>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Data sources — all free or the utility's own</h2>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">What it gives us</th>
                <th className="py-2">Cost &amp; access</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(([s, w, c]) => (
                <tr key={s} className="border-t border-hair align-top">
                  <td className="py-3 pr-4 font-medium">{s}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{w}</td>
                  <td className="py-3 text-muted-foreground">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["When a data source goes down", "Open-Meteo and NASA POWER are independent. The last good response is cached, and IrrigateAI falls back to the fixed schedule rather than guessing."],
            ["When the agent is wrong", "Dismissals are recorded against the incident. Precision and false-alarm rate are tracked publicly on the metrics page, not buried."],
            ["When a reviewer asks 'why?'", "Every decision stores its inputs, reasoning summary, confidence and approving officer. The audit trail exports as CSV from the government page."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">{t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/operator"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Watch it run in the control room
          </Link>
          <Link
            to="/contact"
            search={{ tier: "pilot" as const }}
            className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted"
          >
            Start a 90-day pilot
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
