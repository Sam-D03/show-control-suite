import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminPage, Panel, StatusPill } from "@/components/admin/AdminShell";
import { mockLease } from "@/lib/admin/mockData";

type State = "valid" | "warning" | "expired";

export const Route = createFileRoute("/admin/lease")({
  component: LeasePage,
});

function LeasePage() {
  const [state, setState] = useState<State>(mockLease.state);
  const days =
    state === "expired" ? 0 : state === "warning" ? 3 : mockLease.daysRemaining;

  const tone: "ok" | "warn" | "error" =
    state === "expired" ? "error" : state === "warning" ? "warn" : "ok";

  return (
    <AdminPage
      title="LAN Entitlement Lease"
      description="30-day rolling lease that authorizes offline operation of LAN Control. Cue firing and config changes require online re-auth after expiry."
      actions={
        <>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
              Preview state
            </span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={state}
              onChange={(e) => setState(e.target.value as State)}
            >
              <option value="valid">Valid</option>
              <option value="warning">Warning</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <Button size="sm" disabled={state === "valid"}>
            <RefreshCw /> Refresh lease
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Lease status" className="lg:col-span-2">
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-semibold tabular">{days}</div>
            <div className="text-[12px] text-muted-foreground">days remaining</div>
            <div className="ml-auto">
              <StatusPill tone={tone}>{state.toUpperCase()}</StatusPill>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-panel-elev overflow-hidden">
            <div
              className={`h-full ${
                tone === "ok"
                  ? "bg-status-ok"
                  : tone === "warn"
                    ? "bg-status-warn"
                    : "bg-status-error"
              }`}
              style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
            />
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-[12px]">
            <MetaCell k="Valid until" v={mockLease.validUntil} />
            <MetaCell k="Last renewal" v={mockLease.lastRenewal} />
            <MetaCell k="Days remaining" v={String(days)} />
            <MetaCell k="Auto-renew" v="On (cloud auth)" />
          </dl>
        </Panel>

        <Panel title="Warning schedule">
          <ul className="space-y-1.5 text-[12px]">
            {[14, 7, 3, 1].map((d) => (
              <li
                key={d}
                className="flex items-center justify-between rounded-md border border-panel-edge bg-panel-elev/40 px-2 py-1.5"
              >
                <span>T-{d} days</span>
                <StatusPill
                  tone={days <= d && state !== "expired" ? "warn" : "muted"}
                >
                  {days <= d && state !== "expired" ? "Firing" : "Idle"}
                </StatusPill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Expired behavior" className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
            <Behavior
              tone="ok"
              title="Continues to work"
              items={["View dashboards", "Export logs & rundowns", "Read-only telemetry"]}
            />
            <Behavior
              tone="warn"
              title="Requires re-auth"
              items={[
                "Fire cues from AD Control",
                "Change configuration",
                "Register or approve bridges",
              ]}
            />
            <Behavior
              tone="error"
              title="Blocked until online"
              items={[
                "Issue new machine credentials",
                "Change team membership",
                "Modify authority mode",
              ]}
            />
          </div>
          {state === "expired" ? (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-status-error/50 bg-status-error/10 px-3 py-2 text-[12px]">
              <AlertTriangle className="h-4 w-4 text-status-error" />
              Lease expired. Admin/Owner must sign in online to re-authorize this LAN
              instance.
            </div>
          ) : null}
        </Panel>
      </div>
    </AdminPage>
  );
}

function MetaCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-panel-edge bg-panel-elev/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {k}
      </div>
      <div className="font-medium tabular">{v}</div>
    </div>
  );
}

function Behavior({
  tone,
  title,
  items,
}: {
  tone: "ok" | "warn" | "error";
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-md border border-panel-edge bg-panel-elev/40 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-widest">
          {title}
        </div>
        <StatusPill tone={tone}>{tone}</StatusPill>
      </div>
      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
