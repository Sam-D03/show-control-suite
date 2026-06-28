import { useEffect, useState } from "react";

import type { ShowState } from "@/lib/broadcast/types";
import { broadcastApi } from "@/lib/broadcast/store";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function StatusDot({
  tone,
  pulse = false,
}: {
  tone: "live" | "ok" | "warn" | "error" | "info" | "muted";
  pulse?: boolean;
}) {
  const cls =
    tone === "live"
      ? "bg-status-live"
      : tone === "ok"
        ? "bg-status-ok"
        : tone === "warn"
          ? "bg-status-warn"
          : tone === "error"
            ? "bg-status-error"
            : tone === "info"
              ? "bg-status-info"
              : "bg-muted-foreground/50";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls} ${pulse ? "pulse-live" : ""}`} />;
}

function Cell({
  label,
  children,
  emphasis = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center px-3 border-r border-panel-edge h-full min-w-0">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground leading-none">
        {label}
      </div>
      <div
        className={`mt-1 text-[13px] leading-tight truncate ${emphasis ? "font-semibold text-foreground" : "text-foreground/90"}`}
      >
        {children}
      </div>
    </div>
  );
}

function ConnTag({ label, status }: { label: string; status: ShowState["lanStatus"] }) {
  const tone =
    status === "ONLINE" ? "ok" : status === "DEGRADED" ? "warn" : "error";
  return (
    <div className="flex items-center gap-1.5">
      <StatusDot tone={tone} />
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[11px] text-foreground/90 tabular">{status}</span>
    </div>
  );
}

export function TopStatusBar({ state }: { state: ShowState }) {
  const now = useNow();
  const clock = new Date(now).toLocaleTimeString("en-GB");
  const live = state.mode === "LIVE";

  return (
    <header className="h-11 shrink-0 border-b border-panel-edge bg-panel flex items-stretch">
      {/* Mode pill */}
      <div className="flex items-center px-3 border-r border-panel-edge">
        <div
          className={`flex items-center gap-2 px-2.5 h-7 rounded-sm ${
            live
              ? "bg-status-live/15 text-status-live border border-status-live/40"
              : "bg-status-rehearsal/15 text-status-rehearsal border border-status-rehearsal/40"
          }`}
        >
          <StatusDot tone={live ? "live" : "info"} pulse={live} />
          <span className="text-[12px] font-bold tracking-[0.14em]">
            {live ? "ON AIR" : "REHEARSAL"}
          </span>
        </div>
      </div>

      <Cell label="Event" emphasis>
        {state.eventName}
      </Cell>
      <Cell label="Show Day">{state.showDay}</Cell>
      <Cell label="Match" emphasis>
        {state.match.teamA.short} vs {state.match.teamB.short} · BO{state.match.bestOf}
      </Cell>
      <Cell label="Map">
        {state.match.currentMap} · Map {state.match.mapNumber}
      </Cell>

      <div className="flex items-center gap-4 px-4 border-r border-panel-edge">
        <ConnTag label="LAN" status={state.lanStatus} />
        <ConnTag label="Cloud Mirror" status={state.cloudMirrorStatus} />
        <span className="text-[10px] text-muted-foreground uppercase">read-only</span>
      </div>

      <div className="ml-auto flex items-stretch">
        <SafetyToggle
          label="Disable Automations"
          on={state.disableAutomations}
          onChange={(v) => broadcastApi.disableAutomations(v)}
          dangerWhenOn
        />
        <SafetyToggle
          label="Freeze Outputs"
          on={state.freezeOutputs}
          onChange={(v) => broadcastApi.freezeExternalOutputs(v)}
          dangerWhenOn
        />
        <Cell label="Operator">{state.operator}</Cell>
        <div className="flex flex-col justify-center px-4 min-w-[120px]">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground leading-none">
            Show Clock
          </div>
          <div className="mt-1 text-[15px] font-mono tabular text-foreground font-semibold leading-tight">
            {clock}
          </div>
        </div>
      </div>
    </header>
  );
}

function SafetyToggle({
  label,
  on,
  onChange,
  dangerWhenOn,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  dangerWhenOn?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`px-3 border-r border-panel-edge flex flex-col items-start justify-center min-w-[150px] text-left transition-colors ${
        on
          ? dangerWhenOn
            ? "bg-status-warn/15 hover:bg-status-warn/20"
            : "bg-status-ok/15 hover:bg-status-ok/20"
          : "hover:bg-panel-elev"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground leading-none">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-1.5 leading-tight">
        <StatusDot tone={on ? (dangerWhenOn ? "warn" : "ok") : "muted"} />
        <span
          className={`text-[12px] font-semibold tracking-wider ${
            on ? (dangerWhenOn ? "text-status-warn" : "text-status-ok") : "text-foreground/70"
          }`}
        >
          {on ? "ENGAGED" : "STANDBY"}
        </span>
      </div>
    </button>
  );
}
