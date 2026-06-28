import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, Wifi } from "lucide-react";

import { useShowState } from "@/lib/broadcast/store";
import type { TimerState } from "@/lib/broadcast/types";
import { CurrentMatchPanel } from "@/components/broadcast/CurrentMatchPanel";

export const Route = createFileRoute("/timings")({
  head: () => ({
    meta: [
      { title: "Timings — Broadcast Timer Viewer" },
      {
        name: "description",
        content:
          "Read-only full-screen broadcast timer viewer for stage monitors, TVs, and remote production displays.",
      },
    ],
  }),
  component: TimingsScreen,
});

const DELAY_STORAGE_KEY = "lvctrl.timings.delayOffsetMs";
const MAX_DELAY_MS = 120_000;

function clampDelay(ms: number) {
  return Math.max(0, Math.min(MAX_DELAY_MS, ms));
}

function fmtClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${String(h).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function fmtTod(date: Date) {
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

function shiftTod(tod: string, deltaMs: number): string {
  // tod is HH:MM:SS; shift forward by deltaMs, wrap at 24h
  const [h, m, s] = tod.split(":").map((n) => parseInt(n, 10));
  if ([h, m, s].some((n) => Number.isNaN(n))) return tod;
  const base = h * 3600 + m * 60 + s;
  const shifted = (base + Math.round(deltaMs / 1000) + 86400) % 86400;
  const hh = Math.floor(shifted / 3600);
  const mm = Math.floor((shifted % 3600) / 60);
  const ss = shifted % 60;
  return [hh, mm, ss].map((n) => String(n).padStart(2, "0")).join(":");
}

type Urgency = "completed" | "critical" | "warn" | "running" | "hold";

function urgencyOf(t: TimerState, displayMs: number): Urgency {
  if (displayMs <= 0) return "completed";
  if (!t.running) return "hold";
  if (displayMs < 10_000) return "critical";
  if (displayMs < 60_000) return "warn";
  return "running";
}

const URGENCY_TEXT: Record<Urgency, string> = {
  running: "text-[oklch(0.92_0.06_220)]",
  warn: "text-status-warn",
  critical: "text-status-fire",
  completed: "text-status-fire",
  hold: "text-muted-foreground",
};

const URGENCY_BAR: Record<Urgency, string> = {
  running: "bg-[oklch(0.78_0.12_220)]",
  warn: "bg-status-warn",
  critical: "bg-status-fire",
  completed: "bg-status-fire",
  hold: "bg-muted-foreground/40",
};

const URGENCY_BADGE: Record<Urgency, { label: string; cls: string }> = {
  running: { label: "RUN", cls: "bg-[oklch(0.32_0.05_220)] text-[oklch(0.92_0.06_220)]" },
  warn: { label: "RUN", cls: "bg-status-warn/20 text-status-warn" },
  critical: { label: "FINAL", cls: "bg-status-fire/25 text-status-fire animate-pulse" },
  completed: { label: "DONE", cls: "bg-status-fire/25 text-status-fire" },
  hold: { label: "HOLD", cls: "bg-panel-elev text-muted-foreground" },
};

function TimerBlock({
  timer,
  delayMs,
  size,
}: {
  timer: TimerState;
  delayMs: number;
  size: "xl" | "lg" | "md" | "sm";
}) {
  const displayMs = Math.max(0, timer.remainingMs + delayMs);
  const u = urgencyOf(timer, displayMs);
  const pct =
    timer.totalMs > 0 ? Math.max(0, Math.min(100, (displayMs / timer.totalMs) * 100)) : 0;
  const badge = URGENCY_BADGE[u];

  const timeSize = {
    xl: "text-[22vw] xl:text-[18rem]",
    lg: "text-[14vw] xl:text-[12rem]",
    md: "text-[9vw] xl:text-[7rem]",
    sm: "text-[5vw] xl:text-[4rem]",
  }[size];
  const labelSize = {
    xl: "text-[1.4vw] xl:text-2xl",
    lg: "text-[1.1vw] xl:text-xl",
    md: "text-[0.95vw] xl:text-base",
    sm: "text-[0.8vw] xl:text-sm",
  }[size];

  return (
    <div className="relative h-full w-full bg-panel border border-panel-edge rounded-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 shrink-0">
        <div
          className={`uppercase tracking-[0.22em] font-semibold text-muted-foreground truncate ${labelSize}`}
        >
          {timer.label}
        </div>
        <div
          className={`px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold ${badge.cls}`}
        >
          {badge.label}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-4">
        <div
          className={`font-mono tabular leading-none font-bold ${timeSize} ${URGENCY_TEXT[u]}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          {fmtClock(displayMs)}
        </div>
      </div>

      <div className="px-4 pb-3 shrink-0 space-y-2">
        <div className="h-1.5 w-full bg-background rounded-sm overflow-hidden">
          <div
            className={`h-full transition-all ${URGENCY_BAR[u]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] xl:text-xs text-muted-foreground tabular uppercase tracking-wider">
          <span>
            {timer.targetTod ? (
              <>
                Target {shiftTod(timer.targetTod, delayMs)}
                {delayMs > 0 && (
                  <span className="text-accent ml-1">+{Math.round(delayMs / 1000)}s</span>
                )}
              </>
            ) : (
              <>&nbsp;</>
            )}
          </span>
          {timer.linkedTriggerId && <span className="text-accent">→ linked cue</span>}
        </div>
      </div>
    </div>
  );
}

function DelayControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const seconds = Math.round(value / 1000);
  const adj = (deltaSec: number) => onChange(clampDelay(value + deltaSec * 1000));

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 h-9 rounded-sm bg-panel/90 backdrop-blur border border-panel-edge text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-accent/60"
        >
          Delay <span className="text-accent tabular ml-1">+{seconds}s</span>
        </button>
      ) : (
        <div className="bg-panel/95 backdrop-blur border border-panel-edge rounded-sm p-2 flex items-center gap-2 shadow-2xl">
          <div className="flex flex-col leading-tight pr-2 border-r border-panel-edge">
            <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Video Delay
            </span>
            <span className="text-base tabular font-bold text-accent">+{seconds}s</span>
          </div>
          {[
            { l: "-5s", d: -5 },
            { l: "-1s", d: -1 },
            { l: "+1s", d: 1 },
            { l: "+5s", d: 5 },
          ].map((b) => (
            <button
              key={b.l}
              type="button"
              onClick={() => adj(b.d)}
              className="h-9 w-12 rounded-sm bg-panel-elev border border-panel-edge text-xs tabular font-semibold text-foreground hover:border-accent/60 hover:bg-background transition-colors"
            >
              {b.l}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(0)}
            className="h-9 w-9 rounded-sm bg-panel-elev border border-panel-edge text-muted-foreground hover:text-foreground hover:border-accent/60 flex items-center justify-center"
            title="Reset delay"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-9 w-9 rounded-sm bg-panel-elev border border-panel-edge text-muted-foreground hover:text-foreground hover:border-accent/60 flex items-center justify-center"
            title="Collapse"
          >
            <Minus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TimingsScreen() {
  const state = useShowState();
  const now = useClock();

  const [delayMs, setDelayMs] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DELAY_STORAGE_KEY);
      if (raw) setDelayMs(clampDelay(parseInt(raw, 10) || 0));
    } catch {
      /* noop */
    }
  }, []);
  const updateDelay = (next: number) => {
    setDelayMs(next);
    try {
      localStorage.setItem(DELAY_STORAGE_KEY, String(next));
    } catch {
      /* noop */
    }
  };

  const active = useMemo(
    () => state.timers.filter((t) => t.running || t.remainingMs > 0),
    [state.timers],
  );

  // Prioritize urgency: running first, then by smallest remaining
  const sorted = useMemo(() => {
    return [...active].sort((a, b) => {
      if (a.running !== b.running) return a.running ? -1 : 1;
      return a.remainingMs - b.remainingMs;
    });
  }, [active]);

  const count = sorted.length;
  const matchSummary =
    state.match && `${state.match.teamA.short} vs ${state.match.teamB.short} · ${state.match.currentMap}`;

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top status strip */}
      <header className="shrink-0 h-10 border-b border-panel-edge bg-panel px-4 flex items-center gap-4 text-[11px] uppercase tracking-[0.18em]">
        <span className="font-bold text-accent">{state.eventName}</span>
        <span className="text-muted-foreground">{state.showDay}</span>
        {matchSummary && <span className="text-foreground/80">{matchSummary}</span>}
        <span
          className={`ml-auto flex items-center gap-1.5 text-[10px] ${
            state.lanStatus === "ONLINE" ? "text-status-ok" : "text-status-warn"
          }`}
        >
          <Wifi size={12} /> Read-only · {state.lanStatus}
        </span>
        {delayMs > 0 && (
          <span className="text-accent tabular text-[11px]">
            DELAY +{Math.round(delayMs / 1000)}s
          </span>
        )}
        <span className="text-foreground tabular text-base font-bold">{fmtTod(now)}</span>
      </header>

      {/* Current match header */}
      {state.match && <CurrentMatchPanel match={state.match} />}



      {/* Main area */}
      <main className="flex-1 min-h-0 p-3">
        {count === 0 ? (
          <EmptyState eventName={state.eventName} showDay={state.showDay} now={now} />
        ) : count === 1 ? (
          <div className="h-full w-full">
            <TimerBlock timer={sorted[0]} delayMs={delayMs} size="xl" />
          </div>
        ) : count === 2 ? (
          <div className="h-full w-full grid grid-cols-2 gap-3">
            {sorted.map((t) => (
              <TimerBlock key={t.id} timer={t} delayMs={delayMs} size="lg" />
            ))}
          </div>
        ) : count <= 4 ? (
          <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-3">
            {sorted.map((t) => (
              <TimerBlock key={t.id} timer={t} delayMs={delayMs} size="md" />
            ))}
          </div>
        ) : (
          <div className="h-full w-full grid grid-rows-[2fr_1fr] gap-3">
            <div className="grid grid-cols-2 gap-3 min-h-0">
              {sorted.slice(0, 2).map((t) => (
                <TimerBlock key={t.id} timer={t} delayMs={delayMs} size="lg" />
              ))}
            </div>
            <div
              className="grid gap-3 min-h-0"
              style={{
                gridTemplateColumns: `repeat(${Math.min(sorted.length - 2, 6)}, minmax(0,1fr))`,
              }}
            >
              {sorted.slice(2).map((t) => (
                <TimerBlock key={t.id} timer={t} delayMs={delayMs} size="sm" />
              ))}
            </div>
          </div>
        )}
      </main>

      <DelayControl value={delayMs} onChange={updateDelay} />
    </div>
  );
}

function EmptyState({
  eventName,
  showDay,
  now,
}: {
  eventName: string;
  showDay: string;
  now: Date;
}) {
  return (
    <div className="h-full w-full bg-panel border border-panel-edge rounded-sm flex flex-col items-center justify-center text-center gap-6">
      <div className="text-[10vw] xl:text-[8rem] font-mono tabular font-bold text-muted-foreground/60 leading-none">
        {fmtTod(now)}
      </div>
      <div className="text-2xl uppercase tracking-[0.3em] text-muted-foreground">
        No active timers
      </div>
      <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground/70">
        {eventName} · {showDay}
      </div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-status-ok">
        <Plus size={12} className="opacity-0" />
        Read-only viewer · standby
      </div>
    </div>
  );
}
