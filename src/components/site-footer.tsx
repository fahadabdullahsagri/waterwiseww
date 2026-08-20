import { Link } from "@tanstack/react-router";

const cols = [
  {
    title: "Product",
    links: [
      { to: "/operator", label: "Operator control room" },
      { to: "/citizen", label: "Citizen reporting" },
      { to: "/irrigate", label: "IrrigateAI" },
      { to: "/gov", label: "Government dashboard" },
    ],
  },
  {
    title: "Evidence",
    links: [
      { to: "/how-it-works", label: "How the agents work" },
      { to: "/metrics", label: "Success metrics" },
      { to: "/pricing", label: "Business model" },
      { to: "/contact", label: "Start a pilot" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 font-display text-base font-semibold">
            <span className="grid size-6 place-items-center rounded-md bg-primary">
              <span className="block h-2.5 w-[3px] rounded-full bg-primary-foreground" />
            </span>
            WaterWise
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            An agentic water-loss and irrigation platform. Built on free public data — Open-Meteo
            and NASA POWER — with a human approval gate on every action that reaches a resident.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Team Tech Titans · Agentrix 2026
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {c.title}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <span>Demo data is simulated for a demo city; the agent stack is live.</span>
          <span className="font-mono">Aligned with JJM · AMRUT 2.0 · Atal Bhujal</span>
        </div>
      </div>
    </footer>
  );
}
