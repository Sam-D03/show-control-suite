import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { broadcastApi } from "@/lib/broadcast/store";
import type {
  CueSources,
  DepartmentId,
  EventFamilyId,
  MatchPhase,
  TeamBinding,
  TriggerDefinition,
  TriggerSection,
} from "@/lib/broadcast/types";

const SECTIONS: TriggerSection[] = [
  "MATCH_FLOW",
  "COMPETITIVE",
  "TIMEOUTS",
  "BROADCAST_FLOW",
  "STAGE",
];
const FAMILIES: EventFamilyId[] = [
  "MAP_WIN",
  "MATCH_WIN",
  "TIMEOUT",
  "AUTOMATION",
  "TIMER_COMPLETE",
  "EMERGENCY",
];
const PHASES: (MatchPhase | "ANY")[] = [
  "ANY",
  "PRE_GAME",
  "LIVE",
  "TECH_PAUSE",
  "TACTICAL_TIMEOUT",
  "POST_MAP",
  "BREAK",
];
const TEAMS: TeamBinding[] = ["ANY", "A", "B"];
const DEPARTMENTS: DepartmentId[] = [
  "LIGHTING",
  "LED",
  "AUDIO",
  "GRAPHICS",
  "REPLAY",
  "TIMING",
  "COMPANION",
];

function defaults(t: TriggerDefinition): TriggerDefinition {
  return {
    enabled: t.enabled ?? true,
    visible: t.visible ?? true,
    automationArmed: t.automationArmed ?? false,
    sources: t.sources ?? { manual: true, timer: false, gameApi: false, state: false },
    matchPhaseBinding: t.matchPhaseBinding ?? "ANY",
    teamBinding: t.teamBinding ?? "ANY",
    ...t,
  };
}

export function CueSettingsDialog({
  trigger,
  open,
  onOpenChange,
}: {
  trigger: TriggerDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<TriggerDefinition | null>(null);

  useEffect(() => {
    setDraft(trigger ? defaults(trigger) : null);
  }, [trigger]);

  if (!draft) return null;

  function patch(p: Partial<TriggerDefinition>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }
  function patchSources(p: Partial<CueSources>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            sources: {
              ...(d.sources ?? { manual: true, timer: false, gameApi: false, state: false }),
              ...p,
            },
          }
        : d,
    );
  }
  function toggleDept(dept: DepartmentId) {
    setDraft((d) => {
      if (!d) return d;
      const has = d.departments.includes(dept);
      return {
        ...d,
        departments: has ? d.departments.filter((x) => x !== dept) : [...d.departments, dept],
      };
    });
  }
  function save() {
    if (!draft) return;
    broadcastApi.saveTrigger(draft.id, draft);
    onOpenChange(false);
  }

  const s = draft.sources!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-panel border-panel-edge text-foreground">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-[0.18em] text-accent">
            Cue Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Shared settings used by AD Control buttons and Automation Triggers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cue name
            </Label>
            <Input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              className="h-8 text-xs bg-background border-panel-edge"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Section
            </Label>
            <Select
              value={draft.section}
              onValueChange={(v) => patch({ section: v as TriggerSection })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-panel-edge">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((x) => (
                  <SelectItem key={x} value={x} className="text-xs">
                    {x.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Event family
            </Label>
            <Select
              value={draft.family}
              onValueChange={(v) => patch({ family: v as EventFamilyId })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-panel-edge">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAMILIES.map((x) => (
                  <SelectItem key={x} value={x} className="text-xs">
                    {x.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Output event key
            </Label>
            <Input
              value={draft.outputEventKey ?? ""}
              onChange={(e) => patch({ outputEventKey: e.target.value })}
              placeholder="show.gfx.matchpoint"
              className="h-8 text-xs bg-background border-panel-edge font-mono"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sources / conditions
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {([
                ["manual", "Manual"],
                ["timer", "Timer"],
                ["gameApi", "Game / API"],
                ["state", "Show State"],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm border border-panel-edge bg-background cursor-pointer"
                >
                  <Checkbox
                    checked={s[key]}
                    onCheckedChange={(c) => patchSources({ [key]: !!c } as Partial<CueSources>)}
                  />
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Linked timer ID
            </Label>
            <Input
              value={draft.linkedTimerId ?? ""}
              onChange={(e) => patch({ linkedTimerId: e.target.value || undefined })}
              placeholder="tm-break"
              className="h-8 text-xs bg-background border-panel-edge font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Linked event key
            </Label>
            <Input
              value={draft.linkedEventKey ?? ""}
              onChange={(e) => patch({ linkedEventKey: e.target.value || undefined })}
              placeholder="cs2.round.halftime"
              className="h-8 text-xs bg-background border-panel-edge font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Match phase binding
            </Label>
            <Select
              value={draft.matchPhaseBinding ?? "ANY"}
              onValueChange={(v) => patch({ matchPhaseBinding: v as MatchPhase | "ANY" })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-panel-edge">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((x) => (
                  <SelectItem key={x} value={x} className="text-xs">
                    {x.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Team binding
            </Label>
            <Select
              value={draft.teamBinding ?? "ANY"}
              onValueChange={(v) => patch({ teamBinding: v as TeamBinding })}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-panel-edge">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.map((x) => (
                  <SelectItem key={x} value={x} className="text-xs">
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Set show state (on fire)
            </Label>
            <Input
              value={draft.setShowState ?? ""}
              onChange={(e) => patch({ setShowState: e.target.value || undefined })}
              placeholder="phase=BREAK"
              className="h-8 text-xs bg-background border-panel-edge font-mono"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Departments
            </Label>
            <div className="grid grid-cols-7 gap-1">
              {DEPARTMENTS.map((d) => {
                const on = draft.departments.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDept(d)}
                    className={`h-7 rounded-sm border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                      on
                        ? "bg-accent/15 border-accent/60 text-accent"
                        : "bg-background border-panel-edge text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-3 gap-2 pt-1">
            <Toggle
              label="Enabled"
              checked={draft.enabled ?? true}
              onChange={(c) => patch({ enabled: c })}
            />
            <Toggle
              label="Visible"
              checked={draft.visible ?? true}
              onChange={(c) => patch({ visible: c })}
            />
            <Toggle
              label="Protected (hold-to-fire)"
              checked={draft.protected}
              onChange={(c) => patch({ protected: c })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={save} className="text-xs bg-accent text-accent-foreground">
            Save cue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm border border-panel-edge bg-background">
      <span className="text-xs">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
