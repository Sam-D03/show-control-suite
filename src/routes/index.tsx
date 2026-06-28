import { createFileRoute } from "@tanstack/react-router";

import { ArmStrip } from "@/components/broadcast/ArmStrip";
import { AutomationInbox } from "@/components/broadcast/AutomationInbox";
import { CurrentMatchPanel } from "@/components/broadcast/CurrentMatchPanel";
import { EventLog } from "@/components/broadcast/EventLog";
import { LeftNavRail } from "@/components/broadcast/LeftNavRail";
import { OutputHealthPanel } from "@/components/broadcast/OutputHealthPanel";
import { TimerMiniPanel } from "@/components/broadcast/TimerMiniPanel";
import { TopStatusBar } from "@/components/broadcast/TopStatusBar";
import { TriggerGrid } from "@/components/broadcast/TriggerGrid";
import { useShowState } from "@/lib/broadcast/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AD Control — Live Broadcast Gallery" },
      {
        name: "description",
        content:
          "Assistant Director live control surface for Major-level CS2 broadcast: arm strip, trigger grid, automation inbox, timers, output health, and event log.",
      },
    ],
  }),
  component: AdControlScreen,
});

function AdControlScreen() {
  const state = useShowState();

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopStatusBar state={state} />

      <div className="flex-1 min-h-0 flex">
        <LeftNavRail active="ad" />

        <main className="flex-1 min-w-0 flex flex-col">
          <CurrentMatchPanel match={state.match} />
          <ArmStrip arms={state.arms} />

          {/* Main work area: trigger grid + right column */}
          <div className="flex-1 min-h-0 flex">
            <div className="flex-1 min-w-0 flex flex-col border-r border-panel-edge">
              <TriggerGrid triggers={state.triggers} arms={state.arms} />
            </div>

            <aside className="w-[360px] shrink-0 flex flex-col gap-2 p-2 bg-background min-h-0 overflow-hidden">
              <div className="shrink-0">
                <TimerMiniPanel timers={state.timers} />
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <AutomationInbox
                  signals={state.automation}
                  arms={state.arms}
                  disabled={state.disableAutomations}
                />
              </div>
            </aside>
          </div>

          {/* Bottom: outputs + log */}
          <div className="h-[230px] shrink-0 border-t border-panel-edge p-2 grid grid-cols-[360px_1fr] gap-2 bg-background">
            <OutputHealthPanel outputs={state.outputs} frozen={state.freezeOutputs} />
            <EventLog entries={state.log} />
          </div>
        </main>
      </div>
    </div>
  );
}
