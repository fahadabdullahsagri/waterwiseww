import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Droplets, Radio, MessageSquare, Sprout, Landmark, Play, Loader2 } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { runDemoStep } from "@/lib/waterwise.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WaterWise — agentic water-loss & irrigation platform" },
      {
        name: "description",
        content:
          "An AI agent team that watches a city's water network and a farm's irrigation at once — catching leaks early, alerting wards, and cutting irrigation use, with a human always in the loop.",
      },
      { property: "og:title", content: "WaterWise — agentic water-loss & irrigation platform" },
      {
        property: "og:description",
        content:
          "Leak detection, citizen reporting, irrigation optimisation and scheme compliance in one agentic platform built on free public data.",
      },
    ],
  }),
  component: Landing,
});

const roles = [
  {
    to: "/operator",
    icon: Radio,
    title: "Utility Operator",
    body: "Control-room view: one alert queue, one live map, one trend strip. Approve or reject every agent action.",
  },
  {
    to: "/citizen",
    icon: MessageSquare,
    title: "Resident",
    body: "Report a leak by chat, get a plain-language ETA, see how much water your ward saved.",
  },
  {
    to: "/gov",
    icon: Landmark,
    title: "Government reviewer",
    body: "Non-revenue-water trend against the CPHEEO 15% ceiling, mapped to JJM, AMRUT 2.0 and Atal Bhujal.",
  },
] as const;

const steps = [
  "Resetting the demo city and seeding leak events…",
  "IrrigateAI picked up a low-rainfall signal — raising the drought weight…",
  "LeakSense reprioritised the repair queue and is asking for approval…",
  "A second resident reported the same leak — JalConnect deduped it…",
  "GovDash recomputed the non-revenue-water trend.",
];

function Landing() {
  const runStep = useServerFn(runDemoStep);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function runDemo() {
    setRunning(true);
    try {
      for (let step = 0; step < steps.length; step++) {
        setStatus(steps[step]!);
        await runStep({ data: { step } });
        await queryClient.invalidateQueries();
        if (step === 2) {
          setStatus(steps[2]! + " — open the Operator view to approve it.");
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      setStatus("Demo ready. Walk the judges through Operator → Citizen → Government.");
      await router.navigate({ to: "/operator" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-14">
        <section className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Droplets className="size-3.5 text-primary" />
            Powered by Agentrix — a four-agent engine with a human gate
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            An AI agent team that watches a city's water network and a farm's irrigation
            at the same time.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            WaterWise catches leaks before they flood streets, tells the right ward before
            residents complain, and cuts irrigation water use — all from free public data, with
            a human always able to approve or override.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={runDemo}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {running ? "Running scripted demo…" : "Run the 4-minute demo"}
            </button>
            <Link
              to="/operator"
              className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted"
            >
              Open Operator view
            </Link>
          </div>
          {status && (
            <p className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {status}
            </p>
          )}
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {roles.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <r.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{r.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary group-hover:underline">
                Enter view →
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Radio,
              name: "LeakSense",
              body: "Scores every sensor reading, ranks the repair queue by litres lost × people affected × pipe age, drafts the work order.",
            },
            {
              icon: MessageSquare,
              name: "JalConnect",
              body: "Classifies citizen complaints, geotags the ward, dedupes against open incidents and replies in plain language.",
            },
            {
              icon: Sprout,
              name: "IrrigateAI",
              body: "Turns live weather and evapotranspiration into a daily irrigation target — and raises leak priority in a drought.",
            },
            {
              icon: Landmark,
              name: "GovDash",
              body: "Maps performance to Jal Jeevan Mission, AMRUT 2.0 and Atal Bhujal reporting lines for procurement.",
            },
          ].map((m) => (
            <div key={m.name} className="rounded-2xl border border-border bg-card p-5">
              <m.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-semibold">{m.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </section>

        <p className="mt-10 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <strong>Live simulation:</strong> sensor readings come from a seeded generator writing the
          exact schema real IoT hardware would use — swapping in physical sensors is a data-source
          change, not a rewrite. Weather and evapotranspiration are real, live, keyless API calls.
        </p>
      </main>
    </div>
  );
}
