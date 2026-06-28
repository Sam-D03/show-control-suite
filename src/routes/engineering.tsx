import { createFileRoute } from "@tanstack/react-router";

import { EventLog } from "@/components/broadcast/EventLog";
import { LeftNavRail } from "@/components/broadcast/LeftNavRail";
import { OutputHealthPanel } from "@/components/broadcast/OutputHealthPanel";
import { TopStatusBar } from "@/components/broadcast/TopStatusBar";
import { useShowState } from "@/lib/broadcast/store";

export const Route = createFileRoute("/engineering")({
  head: () => ({
    meta: [
      { title: "Engineering — Output Health & Event Log" },
      {
        name: "description",
        content:
          "Engineering view: output route health for lighting, LED, audio, graphics, replay, timing, and Companion, plus the chronological event log.",
      },
    ],
  }),
  component: EngineeringScreen,
});

function EngineeringScreen() {
  const state = useShowState();

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopStatusBar state={state} />

      <div className="flex-1 min-h-0 flex">
        <LeftNavRail active="engineering" />

        <main className="flex-1 min-w-0 flex flex-col p-2 gap-2 min-h-0">
          <div className="px-1 pt-1 pb-2 border-b border-panel-edge flex items-baseline gap-3">
            <h1 className="text-sm font-bold tracking-[0.18em] uppercase text-accent">
              Engineering
            </h1>
            <span className="text-[11px] text-muted-foreground">
              Output route health and chronological event log
            </span>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-[420px_1fr] gap-2">
            <OutputHealthPanel outputs={state.outputs} frozen={state.freezeOutputs} />
            <EventLog entries={state.log} />
          </div>
        </main>
      </div>
    </div>
  );
}
