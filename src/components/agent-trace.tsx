import { useState } from "react";
import {
  ChevronDown,
  Brain,
  Eye,
  Zap,
  Wrench,
  Database,
  ShieldCheck,
  AlertTriangle,
  Check,
} from "lucide-react";

export type AgentEvent = {
  id: string;
  agent: string;
  trigger: string;
  perception: Record<string, unknown> | null;
  reasoning_summary: string;
  action: string;
  memory: string;
  decision: string;
  confidence: number;
  requires_human_approval: boolean;
  approval_status: string;
  created_at: string;
};

const stageIcon = {
  trigger: Zap,
  perception: Eye,
  reasoning: Brain,
  action: Wrench,
  memory: Database,
  gate: ShieldCheck,
};

export function AgentTrace({
  event,
  onApprove,
  defaultOpen = false,
}: {
  event: AgentEvent;
  onApprove?: (approve: boolean) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pending = event.requires_human_approval && event.approval_status === "pending";

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-1.5 rounded-sm border border-border px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span
            className={`size-1.5 rounded-full ${pending ? "bg-warning" : "bg-primary"}`}
            aria-hidden="true"
          />
          {event.agent}
        </span>
        <span className="flex-1 truncate text-sm text-foreground">{event.trigger}</span>
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          {Math.round(event.confidence * 100)}% conf
        </span>
        {pending ? (
          <span className="flex items-center gap-1 rounded-sm bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
            <AlertTriangle className="size-3" aria-hidden="true" />
            Needs approval
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <Check className="size-3" aria-hidden="true" />
            {event.approval_status === "auto" ? "Auto" : event.approval_status}
          </span>
        )}
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-4 py-4 text-sm">
          <Stage icon={stageIcon.trigger} label="Trigger" body={event.trigger} />
          <Stage
            icon={stageIcon.perception}
            label="Perception"
            body={
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify(event.perception ?? {}, null, 2)}
              </pre>
            }
          />
          <Stage icon={stageIcon.reasoning} label="Reasoning" body={event.reasoning_summary} />
          <Stage icon={stageIcon.action} label="Tool / Action" body={event.action} />
          <Stage icon={stageIcon.memory} label="Memory" body={event.memory} />
          <Stage
            icon={stageIcon.gate}
            label="Human-in-loop gate"
            body={
              pending ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">
                    This action affects residents — it waits for a human.
                  </span>
                  {onApprove && (
                    <>
                      <ApproveButton onApprove={() => onApprove(true)} />
                      <button
                        onClick={() => onApprove(false)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              ) : event.requires_human_approval ? (
                `${(event as { approved_by?: string | null }).approved_by ?? "A human"} ${event.approval_status} this action.`
              ) : (
                "No human gate required — advisory only, nothing dispatched."
              )
            }
          />
        </div>
      )}
    </div>
  );
}

function Stage({
  icon: Icon,
  label,
  body,
}: {
  icon: typeof Brain;
  label: string;
  body: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      <span className="mt-0.5 grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-foreground">{body}</div>
      </div>
    </div>
  );
}

/** Approving a resident-affecting action deserves a gesture: a drop hitting water. */
function ApproveButton({ onApprove }: { onApprove: () => void }) {
  const [rippling, setRippling] = useState(false);

  return (
    <button
      onClick={() => {
        setRippling(true);
        setTimeout(() => setRippling(false), 620);
        onApprove();
      }}
      className="relative overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {rippling && <span className="ripple-drop" />}
      <span className="relative">Approve</span>
    </button>
  );
}
