import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ArmStrip } from "@/components/broadcast/ArmStrip";
import { AutomationInbox } from "@/components/broadcast/AutomationInbox";
import { CurrentMatchPanel } from "@/components/broadcast/CurrentMatchPanel";
import { LeftNavRail } from "@/components/broadcast/LeftNavRail";
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
  const [inboxCollapsed, setInboxCollapsed] = useState(false);

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
              <div className={inboxCollapsed ? "flex-1 min-h-0 flex flex-col" : "shrink-0"}>
                <TimerMiniPanel timers={state.timers} />
              </div>
              <div className={inboxCollapsed ? "shrink-0" : "flex-1 min-h-0 flex flex-col"}>
                <AutomationInbox
                  signals={state.automation}
                  arms={state.arms}
                  disabled={state.disableAutomations}
                  collapsed={inboxCollapsed}
                  onToggleCollapsed={() => setInboxCollapsed((c) => !c)}
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
