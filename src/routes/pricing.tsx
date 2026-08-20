import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RoiCalculator } from "@/components/roi-calculator";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Business model & roadmap — WaterWise" },
      {
        name: "description",
        content:
          "Market sizing, buyer personas, per-connection pricing, unit economics, risks and the path from hackathon MVP to a six-month municipal pilot.",
      },
      { property: "og:title", content: "Business model & roadmap — WaterWise" },
      {
        property: "og:description",
        content: "How WaterWise is priced, who buys it, and what the pilot path looks like.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    id: "pilot" as const,
    cta: "Start the free pilot",
    name: "Pilot",
    price: "₹0",
    unit: "for 90 days, one ward",
    points: [
      "Up to 25 sensor points",
      "Full agent stack, human gate on",
      "Baseline NRW audit report at day 90",
    ],
  },
  {
    id: "municipal" as const,
    cta: "Talk to us about a licence",
    name: "Municipal",
    price: "₹18",
    unit: "per connection / year",
    points: [
      "Unlimited wards and operators",
      "Citizen SMS + IVR channel",
      "Scheme-ready monthly exports",
      "₹1,200 per sensor / year for hardware telemetry",
    ],
    featured: true,
  },
  {
    id: "state" as const,
    cta: "Plan a multi-city rollout",
    name: "State / utility group",
    price: "Custom",
    unit: "multi-city rollout",
    points: [
      "Cross-city NRW benchmarking",
      "On-premise or state-cloud deployment",
      "Training and field-crew onboarding",
    ],
  },
];

const risks = [
  ["Sensor coverage is thin in older networks", "Start with district-metered-area balance data, which most utilities already log; add point sensors where the agent flags the highest uncertainty."],
  ["Agent raises a false alarm and a crew is wasted", "Every dispatch is human-gated; precision and false-alarm rate are tracked on the metrics page and the agent's confidence is shown before approval."],
  ["Utility staff resist a new tool", "The operator view replaces a spreadsheet, not a person — the queue is the same triage they already do, just ranked and pre-filled."],
  ["Public data source changes or goes down", "Open-Meteo and NASA POWER are independent; the system caches the last good response and degrades to the fixed schedule rather than failing."],
  ["Procurement takes longer than a pilot's patience", "Free 90-day ward pilot produces the NRW audit that becomes the procurement justification."],
];

function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <h1 className="text-2xl font-semibold">Business model, impact &amp; roadmap</h1>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["TAM", "$43.7B by 2032", "Global smart water management market"],
            ["SAM", "~4,800 urban local bodies", "India, AMRUT-eligible towns and cities"],
            ["SOM (3 yr)", "40 ULBs", "Roughly 6M connections at ₹18/connection/year"],
          ].map(([k, v, s]) => (
            <div key={k} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
              <div className="mt-1 text-xl font-semibold">{v}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border p-6 ${
                t.featured ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t.name}
              </h2>
              <div className="mt-2 text-3xl font-semibold">{t.price}</div>
              <div className="text-sm text-muted-foreground">{t.unit}</div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {t.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                search={{ tier: t.id }}
                className={`mt-5 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                  t.featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-card hover:bg-muted"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">What one percentage point is worth</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Move the sliders to your city. Every figure is plain arithmetic on your own supply
            volume and cost of water — check it on paper before you believe it.
          </p>
          <div className="mt-6">
            <RoiCalculator />
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Business",
              body: "Buyers are the ULB water department head and the utility's operations engineer. The wedge is non-revenue water: a city losing 30% of treated water is losing treatment cost, pumping energy and billable volume at once. A one-percentage-point NRW reduction on a mid-size city pays the licence several times over.",
            },
            {
              title: "Community & environment",
              body: "Per 1,000 connections the pilot targets ~1.4 million litres recovered a year, fewer unplanned outages, and hours of water-collection labour avoided — labour that in most Indian cities falls on women. Equity is explicit: the priority score weights people affected, not property value.",
            },
            {
              title: "Government",
              body: "Evidence lines up with Jal Jeevan Mission service levels, AMRUT 2.0 NRW targets and Atal Bhujal groundwater management. The audit trail is designed so a reviewer can reconstruct any decision from stored inputs, not trust a score.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Roadmap</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {[
                ["Hackathon MVP (now)", "Four agents, simulated sensors, live weather, human gate, three role views."],
                ["Month 1–2", "Ingest real district-metered-area data from one partner ward; calibrate the leak model against known burst history."],
                ["Month 3–4", "SMS and IVR citizen channel in the local language; field-crew mobile work orders."],
                ["Month 5–6", "Pilot NRW audit report, procurement pack, and a second-ward rollout."],
              ].map(([k, v]) => (
                <li key={k} className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="mt-1 size-2 rounded-full bg-primary" />
                  <span>
                    <strong className="block">{k}</strong>
                    <span className="text-muted-foreground">{v}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Top risks & mitigations</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {risks.map(([r, m]) => (
                <li key={r}>
                  <strong className="block">{r}</strong>
                  <span className="text-muted-foreground">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="mt-10 rounded-2xl border border-primary/40 bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-semibold">Ninety days, one ward, no licence fee</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            The pilot ends with a baseline non-revenue-water audit — the document that usually
            justifies the procurement in the first place.
          </p>
          <Link
            to="/contact"
            search={{ tier: "pilot" as const }}
            className="mt-5 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start a pilot
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
