import { useEffect, useRef, useState } from "react";
import { Lock, Unlock, Zap } from "lucide-react";

import { broadcastApi } from "@/lib/broadcast/store";
import type {
  DepartmentId,
  EventFamilyArm,
  TriggerDefinition,
  TriggerSection,
} from "@/lib/broadcast/types";

const SECTION_LABEL: Record<TriggerSection, string> = {
  MATCH_FLOW: "Match Flow",
  COMPETITIVE: "Competitive Events",
  TIMEOUTS: "Timeouts & Pauses",
  BROADCAST_FLOW: "Broadcast Flow",
  STAGE: "Stage Moments",
};

const DEPT_LABEL: Record<DepartmentId, string> = {
  LIGHTING: "LX",
  LED: "LED",
  AUDIO: "A1",
  GRAPHICS: "GFX",
  REPLAY: "RPL",
  TIMING: "TMG",
  COMPANION: "CMP",
};

const HOLD_MS = 650;

function fmtSince(ts?: number) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function TriggerGrid({
  triggers,
  arms,
}: {
  triggers: TriggerDefinition[];
  arms: EventFamilyArm[];
}) {
  const armedMap = new Map(arms.map((a) => [a.family, a.armed]));
  const sections = (Object.keys(SECTION_LABEL) as TriggerSection[]).map((id) => ({
    id,
    label: SECTION_LABEL[id],
    items: triggers.filter((t) => t.section === id),
  }));

  return (
    <section className="flex-1 min-h-0 overflow-auto bg-background">
      <div className="p-3 space-y-3">
        {sections.map((section) => (
          <div key={section.id}>
            <SectionHeader label={section.label} count={section.items.length} />
            <div className="grid grid-cols-4 gap-2">
              {section.items.map((t) => (
                <TriggerCard
                  key={t.id}
                  trigger={t}
                  armed={armedMap.get(t.family) ?? false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground/70 tabular">{count}</span>
      <span className="flex-1 h-px bg-panel-edge" />
    </div>
  );
}

function TriggerCard({
  trigger,
  armed,
}: {
  trigger: TriggerDefinition;
  armed: boolean;
}) {
  const locked = trigger.protected && !armed;
  const [holding, setHolding] = useState(false);
  const [tick, setTick] = useState(0);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-render "last fired" rolling label
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  function fire() {
    broadcastApi.fireTrigger(trigger.id);
  }

  function startHold() {
    if (locked) return;
    if (!trigger.protected) {
      fire();
      return;
    }
    setHolding(true);
    holdRef.current = setTimeout(() => {
      setHolding(false);
      fire();
    }, HOLD_MS);
  }
  function cancelHold() {
    if (holdRef.current) clearTimeout(holdRef.current);
    holdRef.current = null;
    setHolding(false);
  }

  const baseTone = locked
    ? "border-panel-edge bg-panel/60 text-foreground/40 cursor-not-allowed"
    : trigger.protected
      ? "border-status-armed/60 bg-panel-elev hover:border-status-armed text-foreground"
      : "border-panel-edge bg-panel-elev hover:border-accent/70 hover:bg-panel-elev/80 text-foreground";

  return (
    <button
      type="button"
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      disabled={locked}
      className={`relative overflow-hidden text-left h-[92px] px-2.5 py-2 rounded-sm border flex flex-col transition-colors select-none ${baseTone}`}
    >
      {/* hold-to-fire progress */}
      {holding && (
        <span
          className="absolute left-0 bottom-0 h-[3px] bg-status-armed origin-left"
          style={{ width: "100%", animation: `hold-fill ${HOLD_MS}ms linear forwards` }}
        />
      )}

      <div className="flex items-start justify-between gap-1">
        <span className="text-[13px] font-semibold leading-tight truncate">
          {trigger.name}
        </span>
        {trigger.protected ? (
          locked ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <Unlock className="h-3.5 w-3.5 text-status-armed shrink-0" />
          )
        ) : (
          <Zap className="h-3.5 w-3.5 text-accent shrink-0" />
        )}
      </div>

      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {trigger.family.replace("_", " ")}
        </span>
        {trigger.protected && (
          <span
            className={`text-[9px] uppercase tracking-wider px-1 rounded-sm border ${
              locked
                ? "text-muted-foreground border-panel-edge"
                : "text-status-armed border-status-armed/60"
            }`}
          >
            {locked ? "LOCKED" : "ARMED"}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {trigger.departments.map((d) => (
            <span
              key={d}
              className="text-[9px] font-mono tabular px-1 py-[1px] rounded-sm bg-background/60 border border-panel-edge text-foreground/75"
              title={d}
            >
              {DEPT_LABEL[d]}
            </span>
          ))}
        </div>
        <span
          key={tick}
          className="text-[9px] text-muted-foreground tabular shrink-0"
        >
          {fmtSince(trigger.lastFiredAt)}
        </span>
      </div>
    </button>
  );
}
