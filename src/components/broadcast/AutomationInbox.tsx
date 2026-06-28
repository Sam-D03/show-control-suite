import { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";

import type { AutomationSignal, EventFamilyArm } from "@/lib/broadcast/types";

function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function AutomationInbox({
  signals,
  arms,
  disabled,
}: {
  signals: AutomationSignal[];
  arms: EventFamilyArm[];
  disabled: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pending = signals.filter((s) => s.status === "PENDING");
  return (
    <section className="bg-panel border border-panel-edge rounded-sm flex flex-col min-h-0">
      <header className="flex items-center justify-between px-3 h-9 border-b border-panel-edge shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 -mx-1 px-1 py-0.5 rounded-sm hover:bg-panel-elev"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand automation inbox" : "Collapse automation inbox"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Automation Inbox
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-status-info/15 text-status-info tabular">
            {pending.length}
          </span>
        </button>
        {disabled && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-status-warn/15 text-status-warn uppercase tracking-wider">
            Auto disabled
          </span>
        )}
      </header>
      {!collapsed && (
        <div className="flex-1 overflow-auto">
          {pending.length === 0 && (
            <div className="p-4 text-[12px] text-muted-foreground text-center">
              No pending automation signals.
            </div>
          )}
          {pending.map((s) => {
            const arm = arms.find((a) => a.family === s.requiredArm);
            return (
              <article
                key={s.id}
                className="px-3 py-2 border-b border-panel-edge last:border-b-0 hover:bg-panel-elev/60"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-status-info shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] leading-tight text-foreground">
                      {s.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground tabular">
                      <span className="px-1 py-[1px] border border-panel-edge rounded-sm uppercase tracking-wider">
                        {s.source}
                      </span>
                      <span>{Math.round(s.confidence * 100)}% conf</span>
                      <span>· {ago(s.receivedAt)} ago</span>
                      <span
                        className={`ml-auto px-1 py-[1px] rounded-sm border uppercase tracking-wider ${
                          arm?.armed
                            ? "text-status-armed border-status-armed/60"
                            : "text-muted-foreground border-panel-edge"
                        }`}
                      >
                        req {s.requiredArm.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 pl-3.5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-3 w-3" />
                    Inspect
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
