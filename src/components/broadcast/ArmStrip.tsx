import { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";

import { broadcastApi } from "@/lib/broadcast/store";
import type { EventFamilyArm, EventFamilyId } from "@/lib/broadcast/types";

const FAMILY_LABEL: Record<EventFamilyId, string> = {
  MAP_WIN: "Map Win",
  MATCH_WIN: "Match Win",
  TIMEOUT: "Timeout",
  AUTOMATION: "Automation",
  TIMER_COMPLETE: "Timer Complete",
  EMERGENCY: "Emergency",
};

function fmtCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function ArmStrip({ arms }: { arms: EventFamilyArm[] }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="bg-panel border-b border-panel-edge px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Arm Strip — Event Families
        </div>
        <div className="text-[10px] text-muted-foreground">
          Protected triggers require their family to be armed
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {arms.map((arm) => (
          <ArmCell key={arm.family} arm={arm} label={FAMILY_LABEL[arm.family]} />
        ))}
      </div>
    </section>
  );
}

function ArmCell({ arm, label }: { arm: EventFamilyArm; label: string }) {
  const remaining = arm.armed && arm.expiresAt ? arm.expiresAt - Date.now() : 0;
  const armed = arm.armed;
  const emergency = arm.family === "EMERGENCY";

  const base =
    "group h-[68px] px-3 py-2 rounded-sm border flex flex-col justify-between text-left transition-colors";
  const armedCls = emergency
    ? "border-status-error bg-status-error/15 text-status-error hover:bg-status-error/20"
    : "border-status-armed bg-status-armed/15 text-status-armed hover:bg-status-armed/20";
  const idleCls = emergency
    ? "border-status-error/50 bg-panel-elev hover:bg-status-error/10 text-status-error"
    : "border-panel-edge bg-panel-elev hover:bg-panel-edge text-foreground/80";

  return (
    <button
      type="button"
      onClick={() =>
        armed ? broadcastApi.disarmEventFamily(arm.family) : broadcastApi.armEventFamily(arm.family)
      }
      className={`${base} ${armed ? armedCls : idleCls}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] font-semibold">{label}</span>
        {armed ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 opacity-60" />}
      </div>
      <div className="flex items-end justify-between">
        <span
          className={`text-[13px] font-bold tracking-wider ${
            armed ? "" : "text-muted-foreground"
          }`}
        >
          {armed ? "ARMED" : "SAFE"}
        </span>
        <span className="text-[12px] font-mono tabular opacity-90">
          {armed ? (arm.expiresAt ? `T-${fmtCountdown(remaining)}` : "HOLD") : "—"}
        </span>
      </div>
    </button>
  );
}
