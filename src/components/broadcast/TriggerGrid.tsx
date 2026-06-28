import { useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, Lock, Pause, Play, RotateCcw, Unlock, Zap } from "lucide-react";

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

const DEFAULT_SECTION_ORDER: TriggerSection[] = [
  "MATCH_FLOW",
  "COMPETITIVE",
  "TIMEOUTS",
  "BROADCAST_FLOW",
  "STAGE",
];

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

type DragState =
  | { kind: "trigger"; section: TriggerSection; id: string }
  | { kind: "section"; id: TriggerSection }
  | null;

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

  const [sectionOrder, setSectionOrder] = useState<TriggerSection[]>(DEFAULT_SECTION_ORDER);
  const [triggerOrder, setTriggerOrder] = useState<Record<TriggerSection, string[]>>(() => {
    const init = {} as Record<TriggerSection, string[]>;
    for (const s of DEFAULT_SECTION_ORDER) init[s] = [];
    return init;
  });

  // Merge incoming triggers into local order state (append new, drop missing).
  useEffect(() => {
    setTriggerOrder((prev) => {
      const next = {} as Record<TriggerSection, string[]>;
      for (const s of DEFAULT_SECTION_ORDER) {
        const inSection = triggers.filter((t) => t.section === s).map((t) => t.id);
        const existing = (prev[s] ?? []).filter((id) => inSection.includes(id));
        const added = inSection.filter((id) => !existing.includes(id));
        next[s] = [...existing, ...added];
      }
      return next;
    });
  }, [triggers]);

  const triggerById = useMemo(() => {
    const m = new Map<string, TriggerDefinition>();
    for (const t of triggers) m.set(t.id, t);
    return m;
  }, [triggers]);

  const [drag, setDrag] = useState<DragState>(null);
  const dragRef = useRef<DragState>(null);
  dragRef.current = drag;

  function onTriggerDragStart(section: TriggerSection, id: string) {
    setDrag({ kind: "trigger", section, id });
  }
  function onTriggerDragOver(section: TriggerSection, overId: string, e: React.DragEvent) {
    const d = dragRef.current;
    if (!d || d.kind !== "trigger" || d.section !== section || d.id === overId) return;
    e.preventDefault();
    setTriggerOrder((prev) => {
      const list = [...prev[section]];
      const from = list.indexOf(d.id);
      const to = list.indexOf(overId);
      if (from < 0 || to < 0) return prev;
      list.splice(from, 1);
      list.splice(to, 0, d.id);
      return { ...prev, [section]: list };
    });
  }

  function onSectionDragStart(id: TriggerSection) {
    setDrag({ kind: "section", id });
  }
  function onSectionDragOver(overId: TriggerSection, e: React.DragEvent) {
    const d = dragRef.current;
    if (!d || d.kind !== "section" || d.id === overId) return;
    e.preventDefault();
    setSectionOrder((prev) => {
      const list = [...prev];
      const from = list.indexOf(d.id);
      const to = list.indexOf(overId);
      if (from < 0 || to < 0) return prev;
      list.splice(from, 1);
      list.splice(to, 0, d.id);
      return list;
    });
  }
  function endDrag() {
    setDrag(null);
  }

  return (
    <section className="flex-1 min-h-0 overflow-auto bg-background">
      <div className="p-3 space-y-3">
        {sectionOrder.map((sectionId) => {
          const ids = triggerOrder[sectionId] ?? [];
          const items = ids
            .map((id) => triggerById.get(id))
            .filter((t): t is TriggerDefinition => !!t);
          const isSectionDragging = drag?.kind === "section" && drag.id === sectionId;
          return (
            <div
              key={sectionId}
              onDragOver={(e) => onSectionDragOver(sectionId, e)}
              onDrop={endDrag}
              className={isSectionDragging ? "opacity-50" : ""}
            >
              <SectionHeader
                label={SECTION_LABEL[sectionId]}
                count={items.length}
                onDragStart={() => onSectionDragStart(sectionId)}
                onDragEnd={endDrag}
              />
              <div className="grid grid-cols-4 gap-2">
                {items.map((t) => (
                  <TriggerCard
                    key={t.id}
                    trigger={t}
                    armed={armedMap.get(t.family) ?? false}
                    isDragging={
                      drag?.kind === "trigger" && drag.id === t.id
                    }
                    onDragStart={() => onTriggerDragStart(sectionId, t.id)}
                    onDragOver={(e) => onTriggerDragOver(sectionId, t.id, e)}
                    onDragEnd={endDrag}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({
  label,
  count,
  onDragStart,
  onDragEnd,
}: {
  label: string;
  count: number;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title="Drag to reorder section"
        aria-label={`Reorder ${label} section`}
        className="p-0.5 -ml-0.5 text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </button>
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
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  trigger: TriggerDefinition;
  armed: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const locked = trigger.protected && !armed;
  const [holding, setHolding] = useState(false);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState(false);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const lastFiredRef = useRef<number | undefined>(trigger.lastFiredAt);

  // Re-render "last fired" rolling label
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Visual feedback when this trigger fires
  useEffect(() => {
    if (trigger.lastFiredAt && trigger.lastFiredAt !== lastFiredRef.current) {
      lastFiredRef.current = trigger.lastFiredAt;
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 700);
      return () => clearTimeout(id);
    }
  }, [trigger.lastFiredAt]);


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
    ? "border-panel-edge bg-panel/60 text-foreground/40"
    : trigger.protected
      ? "border-status-armed/60 bg-panel-elev hover:border-status-armed text-foreground"
      : "border-panel-edge bg-panel-elev hover:border-accent/70 hover:bg-panel-elev/80 text-foreground";

  return (
    <div
      ref={cardRef}
      onDragOver={onDragOver}
      onDrop={onDragEnd}
      className={`relative overflow-hidden ${trigger.hasTimerControls ? "h-[132px]" : "h-[92px]"} rounded-sm border flex flex-col transition-colors select-none ${baseTone} ${
        locked ? "cursor-not-allowed" : ""
      } ${isDragging ? "opacity-40" : ""} ${flash ? "fire-flash" : ""}`}

    >
      {/* drag handle */}
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onPointerDown={(e) => e.stopPropagation()}
        title="Drag to reorder"
        aria-label={`Reorder ${trigger.name}`}
        className="absolute top-1 right-1 z-10 p-0.5 rounded-sm text-muted-foreground/50 hover:text-foreground hover:bg-background/60 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        disabled={locked}
        className="absolute inset-0 text-left px-2.5 py-2 flex flex-col disabled:cursor-not-allowed"
      >
        {/* hold-to-fire progress */}
        {holding && (
          <span
            className="absolute left-0 bottom-0 h-[3px] bg-status-armed origin-left"
            style={{ width: "100%", animation: `hold-fill ${HOLD_MS}ms linear forwards` }}
          />
        )}

        <div className="flex items-start justify-between gap-1 pr-5">
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

      {trigger.hasTimerControls && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 bottom-0 z-10 px-2 py-1.5 border-t border-panel-edge bg-panel/95 backdrop-blur-sm flex items-center gap-1"
        >
          <span className="font-mono tabular text-[13px] text-foreground leading-none mr-1">
            00:30
          </span>
          <button
            type="button"
            title="Play"
            className="h-5 w-5 rounded-sm bg-panel-elev border border-panel-edge text-foreground hover:bg-background hover:border-accent/60 transition-colors flex items-center justify-center"
          >
            <Play size={12} />
          </button>
          <button
            type="button"
            title="Pause"
            className="h-5 w-5 rounded-sm bg-panel-elev border border-panel-edge text-foreground hover:bg-background hover:border-accent/60 transition-colors flex items-center justify-center"
          >
            <Pause size={12} />
          </button>
          <button
            type="button"
            title="Reset to 0"
            className="h-5 w-5 rounded-sm bg-panel-elev border border-panel-edge text-foreground hover:bg-background hover:border-accent/60 transition-colors flex items-center justify-center"
          >
            <RotateCcw size={12} />
          </button>
          <div className="w-px h-3 bg-panel-edge mx-0.5" />
          {["+20s", "-20s", "+1m", "-1m"].map((label) => (
            <button
              key={label}
              type="button"
              title={label}
              className="h-5 px-1.5 rounded-sm bg-panel-elev border border-panel-edge text-[10px] text-muted-foreground hover:bg-background hover:text-foreground hover:border-accent/60 transition-colors tabular"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
