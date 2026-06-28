import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Power, Workflow } from "lucide-react";

import { CueSettingsDialog } from "@/components/broadcast/CueSettingsDialog";
import { LeftNavRail } from "@/components/broadcast/LeftNavRail";
import { TopStatusBar } from "@/components/broadcast/TopStatusBar";
import { Switch } from "@/components/ui/switch";
import { broadcastApi, useShowState } from "@/lib/broadcast/store";
import type { CueSources, TriggerDefinition } from "@/lib/broadcast/types";

const SECTION_LABEL: Record<string, string> = {
  MATCH_FLOW: "Match Flow",
  COMPETITIVE: "Competitive",
  TIMEOUTS: "Timeouts",
  BROADCAST_FLOW: "Broadcast",
  STAGE: "Stage",
};

function fmtSince(ts?: number) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function isAutomationOnly(t: TriggerDefinition): boolean {
  const s: CueSources = t.sources ?? { manual: true, timer: false, gameApi: false, state: false };
  if (s.manual !== false) return false;
  return s.timer || s.gameApi || s.state;
}

function sourceLabels(s?: CueSources): string[] {
  const out: string[] = [];
  if (!s) return out;
  if (s.timer) out.push("TIMER");
  if (s.gameApi) out.push("GAME");
  if (s.state) out.push("STATE");
  return out;
}

export const Route = createFileRoute("/automation-triggers")({
  head: () => ({
    meta: [
      { title: "Automation Triggers — Cue Rules" },
      {
        name: "description",
        content:
          "Automation-only cue rules: when timer, game API, or show state conditions match, fire the linked cue. No manual firing.",
      },
    ],
  }),
  component: AutomationTriggersScreen,
});

function AutomationTriggersScreen() {
  const state = useShowState();
  const [editing, setEditing] = useState<TriggerDefinition | null>(null);

  const rows = useMemo(
    () => state.triggers.filter(isAutomationOnly),
    [state.triggers],
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopStatusBar state={state} />

      <div className="flex-1 min-h-0 flex">
        <LeftNavRail active="automation" />

        <main className="flex-1 min-w-0 flex flex-col p-2 gap-2 min-h-0">
          <div className="px-1 pt-1 pb-2 border-b border-panel-edge flex items-baseline gap-3">
            <Workflow className="h-4 w-4 text-accent self-center" />
            <h1 className="text-sm font-bold tracking-[0.18em] uppercase text-accent">
              Automation Triggers
            </h1>
            <span className="text-[11px] text-muted-foreground">
              Rule-driven cues — fired by timers, game API, or show state. Manual firing disabled.
            </span>
            <span className="ml-auto text-[11px] text-muted-foreground tabular">
              {rows.length} rules
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto border border-panel-edge rounded-sm bg-panel">
            <table className="w-full text-[11px] tabular border-collapse">
              <thead className="sticky top-0 z-10 bg-panel-elev text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-panel-edge">
                  <Th className="w-14 text-center">On</Th>
                  <Th className="w-20 text-center">Auto Arm</Th>
                  <Th>Cue Name</Th>
                  <Th className="w-24">Section</Th>
                  <Th className="w-32">Source</Th>
                  <Th className="w-44">Linked Timer / Event</Th>
                  <Th className="w-32">Phase / Team</Th>
                  <Th className="w-40">Output Event Key</Th>
                  <Th className="w-40">Set Show State</Th>
                  <Th className="w-20">Last Fired</Th>
                  <Th className="w-16 text-right pr-3">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-muted-foreground py-8 text-xs">
                      No automation-only cues defined.
                    </td>
                  </tr>
                )}
                {rows.map((t) => {
                  const armed = t.automationArmed ?? false;
                  const enabled = t.enabled ?? true;
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-panel-edge hover:bg-panel-elev/60 ${
                        enabled ? "" : "text-muted-foreground/60"
                      }`}
                    >
                      <Td className="text-center">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(c) => broadcastApi.saveTrigger(t.id, { enabled: c })}
                        />
                      </Td>
                      <Td className="text-center">
                        <button
                          type="button"
                          onClick={() => broadcastApi.setCueAutomationArm(t.id, !armed)}
                          title={armed ? "Disarm automation" : "Arm automation"}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[10px] uppercase tracking-wider transition-colors ${
                            armed
                              ? "border-status-armed/60 bg-status-armed/15 text-status-armed"
                              : "border-panel-edge bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Power className="h-3 w-3" />
                          {armed ? "ARMED" : "OFF"}
                        </button>
                      </Td>
                      <Td className="font-semibold text-foreground text-xs">{t.name}</Td>
                      <Td>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {SECTION_LABEL[t.section] ?? t.section}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex gap-1 flex-wrap">
                          {sourceLabels(t.sources).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-mono px-1 rounded-sm bg-background border border-panel-edge text-foreground/80"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </Td>
                      <Td className="font-mono text-[10px] text-foreground/80 truncate">
                        {t.linkedTimerId ? `timer:${t.linkedTimerId}` : ""}
                        {t.linkedTimerId && t.linkedEventKey ? " · " : ""}
                        {t.linkedEventKey ?? ""}
                        {!t.linkedTimerId && !t.linkedEventKey && (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </Td>
                      <Td className="text-[10px]">
                        <span className="text-foreground/80">{t.matchPhaseBinding ?? "ANY"}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-foreground/80">{t.teamBinding ?? "ANY"}</span>
                      </Td>
                      <Td className="font-mono text-[10px] text-foreground/80 truncate">
                        {t.outputEventKey ?? <span className="text-muted-foreground/50">—</span>}
                      </Td>
                      <Td className="font-mono text-[10px] text-foreground/80 truncate">
                        {t.setShowState ?? <span className="text-muted-foreground/50">—</span>}
                      </Td>
                      <Td className="text-[10px] text-muted-foreground">
                        {fmtSince(t.lastFiredAt)}
                      </Td>
                      <Td className="text-right pr-3">
                        <button
                          type="button"
                          onClick={() => setEditing(t)}
                          title="Edit cue settings"
                          className="inline-flex items-center justify-center h-6 w-6 rounded-sm border border-panel-edge bg-background hover:border-accent/60 hover:text-accent transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <CueSettingsDialog
        trigger={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-2 py-1.5 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-1 align-middle ${className}`}>{children}</td>;
}
