import { Link } from "@tanstack/react-router";

import { FlowLine } from "@/components/flow-line";

const links = [
  { to: "/operator", label: "Operator" },
  { to: "/citizen", label: "Citizen" },
  { to: "/irrigate", label: "IrrigateAI" },
  { to: "/gov", label: "Government" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/metrics", label: "Metrics" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteNav({
  intensity = 0.3,
  alertCount = 0,
  loading = false,
  right,
}: {
  intensity?: number;
  alertCount?: number;
  loading?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-[17px] font-semibold tracking-tight"
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary">
            <span className="block h-3 w-[3px] rounded-full bg-primary-foreground" />
          </span>
          WaterWise
          <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Agentrix
          </span>
        </Link>
        <nav className="-mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none] sm:w-auto sm:overflow-visible">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary/12 text-primary font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
      </div>
      <FlowLine intensity={intensity} alertCount={alertCount} loading={loading} />
    </header>
  );
}
