import { Pause, Play, RotateCcw } from "lucide-react";

import { broadcastApi } from "@/lib/broadcast/store";
import type { TimerState } from "@/lib/broadcast/types";

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const TIME_ADJUSTMENTS = [
  { label: "+20s", deltaMs: 20_000 },
  { label: "-20s", deltaMs: -20_000 },
  { label: "+1m", deltaMs: 60_000 },
  { label: "-1m", deltaMs: -60_000 },
] as const;

export function TimerMiniPanel({ timers }: { timers: TimerState[] }) {
  return (
    <section className="bg-panel border border-panel-edge rounded-sm flex flex-col min-h-0">
      <header className="flex items-center justify-between px-3 h-9 border-b border-panel-edge shrink-0">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Active Timers
        </span>
        <span className="text-[10px] text-muted-foreground tabular">{timers.length}</span>
      </header>
      <div className="p-2 grid grid-cols-1 gap-2 flex-1 overflow-auto content-start">
        {timers.map((t) => {
          const pct = Math.max(0, Math.min(100, (t.remainingMs / t.totalMs) * 100));
          const low = t.remainingMs < 30_000 && t.running;
          return (
            <div
              key={t.id}
              className="px-2.5 py-2 bg-panel-elev rounded-sm border border-panel-edge"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[12px] font-semibold text-foreground truncate">{t.label}</div>
                <div
                  className={`font-mono tabular text-[20px] leading-none ${
                    low ? "text-status-warn" : t.running ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {fmt(t.remainingMs)}
                </div>
              </div>
              <div className="mt-1.5 h-1 w-full bg-background rounded-sm overflow-hidden">
                <div
                  className={`h-full ${
                    low ? "bg-status-warn" : t.running ? "bg-accent" : "bg-muted-foreground/50"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground tabular">
                <span>
                  {t.running ? "RUN" : "HOLD"}
                  {t.targetTod ? ` · target ${t.targetTod}` : ""}
                </span>
                {t.linkedTriggerId && (
                  <span className="text-accent uppercase tracking-wider">linked → cue</span>
                )}
              </div>

              {/* Timer controls */}
              <div className="mt-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    console.log("playPause", t.id);
                    broadcastApi.playPauseTimer(t.id);
                  }}
                  className="h-5 w-5 rounded-sm bg-panel border border-panel-edge text-foreground hover:bg-background hover:border-accent/60 transition-colors flex items-center justify-center"
                  title={t.running ? "Pause" : "Play"}
                >
                  {t.running ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log("reset", t.id);
                    broadcastApi.resetTimer(t.id);
                  }}
                  className="h-5 w-5 rounded-sm bg-panel border border-panel-edge text-foreground hover:bg-background hover:border-accent/60 transition-colors flex items-center justify-center"
                  title="Reset to 0"
                >
                  <RotateCcw size={12} />
                </button>
                <div className="w-px h-3 bg-panel-edge mx-0.5" />
                {TIME_ADJUSTMENTS.map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => broadcastApi.adjustTimer(t.id, btn.deltaMs)}
                    className="h-5 px-1.5 rounded-sm bg-panel border border-panel-edge text-[10px] text-muted-foreground hover:bg-background hover:text-foreground hover:border-accent/60 transition-colors tabular"
                    title={btn.label}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
