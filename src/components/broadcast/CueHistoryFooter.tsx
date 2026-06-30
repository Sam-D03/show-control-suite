import { useMemo, useRef, useState, useEffect } from "react";
import {
  History,
  ChevronUp,
  ChevronDown,
  Search,
  CircleDot,
  Wifi,
  WifiOff,
  Loader2,
  User,
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  SkipForward,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ── Types (kept local; ready to be promoted to a shared types module) ──────
export type CueHistorySource = "MANUAL" | "AUTOMATED";
export type CueHistoryStatus =
  | "FIRED"
  | "SKIPPED"
  | "FAILED"
  | "WARNING"
  | "RECOVERED";
export type CueHistorySyncStatus = "SYNCED" | "SYNCING" | "OFFLINE";

export interface CueHistoryItem {
  id: string;
  cueNumber: string;
  cueName: string;
  firedAt: number;
  source: CueHistorySource;
  operator?: string;
  automationLabel?: string;
  status: CueHistoryStatus;
  family?: string;
  departments?: string[];
  note?: string;
}

export interface CueHistoryFooterProps {
  items?: CueHistoryItem[];
  syncStatus?: CueHistorySyncStatus;
  loading?: boolean;
  liveActive?: boolean;
  onInspect?: (item: CueHistoryItem) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

// ── Mock fixture ───────────────────────────────────────────────────────────
const now = Date.now();
const MOCK_HISTORY: CueHistoryItem[] = [
  { id: "h1",  cueNumber: "AD-104", cueName: "Map Veto Reveal",        firedAt: now - 1000 * 60 * 14, source: "MANUAL",    operator: "K. Rauma",     status: "FIRED",     family: "BROADCAST_FLOW", departments: ["LED", "GRAPHICS", "AUDIO"] },
  { id: "h2",  cueNumber: "AD-105", cueName: "Player Intro Roll-in",   firedAt: now - 1000 * 60 * 12, source: "MANUAL",    operator: "K. Rauma",     status: "FIRED",     family: "STAGE",          departments: ["LIGHTING", "AUDIO", "LED"] },
  { id: "h3",  cueNumber: "AD-106", cueName: "Map Loaded — Mirage",    firedAt: now - 1000 * 60 * 10, source: "AUTOMATED", automationLabel: "CS2 GSI", status: "FIRED",     family: "MATCH_FLOW",     departments: ["GRAPHICS", "TIMING"] },
  { id: "h4",  cueNumber: "AD-107", cueName: "Pistol Round Start",     firedAt: now - 1000 * 60 * 9,  source: "AUTOMATED", automationLabel: "CS2 GSI", status: "WARNING",   family: "COMPETITIVE",    departments: ["LED", "AUDIO"], note: "Graphics ACK delayed 380ms" },
  { id: "h5",  cueNumber: "AD-108", cueName: "Bomb Plant Sting",       firedAt: now - 1000 * 60 * 8,  source: "AUTOMATED", automationLabel: "CS2 GSI", status: "FIRED",     family: "COMPETITIVE",    departments: ["AUDIO"] },
  { id: "h6",  cueNumber: "AD-109", cueName: "Tactical Timeout — Team A", firedAt: now - 1000 * 60 * 7, source: "MANUAL",   operator: "K. Rauma",     status: "FIRED",     family: "TIMEOUTS",       departments: ["LED", "GRAPHICS", "AUDIO", "TIMING"] },
  { id: "h7",  cueNumber: "AD-110", cueName: "Replay Wipe",            firedAt: now - 1000 * 60 * 6,  source: "MANUAL",    operator: "S. Devlin",    status: "SKIPPED",   family: "BROADCAST_FLOW", note: "Director called audible" },
  { id: "h8",  cueNumber: "AD-111", cueName: "Half-time Break Start",  firedAt: now - 1000 * 60 * 5,  source: "AUTOMATED", automationLabel: "TIMER",   status: "FIRED",     family: "MATCH_FLOW",     departments: ["LED", "GRAPHICS", "AUDIO"] },
  { id: "h9",  cueNumber: "AD-112", cueName: "LED Sponsor Loop",       firedAt: now - 1000 * 60 * 4,  source: "AUTOMATED", automationLabel: "TIMER",   status: "FAILED",    family: "BROADCAST_FLOW", departments: ["LED"], note: "LED feed offline — fallback fired" },
  { id: "h10", cueNumber: "AD-113", cueName: "LED Sponsor Loop",       firedAt: now - 1000 * 60 * 3,  source: "MANUAL",    operator: "K. Rauma",     status: "RECOVERED", family: "BROADCAST_FLOW", departments: ["LED"], note: "Manual re-fire after failure" },
  { id: "h11", cueNumber: "AD-114", cueName: "Match Point Sting",      firedAt: now - 1000 * 60 * 2,  source: "AUTOMATED", automationLabel: "CS2 GSI", status: "FIRED",     family: "COMPETITIVE",    departments: ["AUDIO", "LIGHTING"] },
  { id: "h12", cueNumber: "AD-115", cueName: "Map Win — Team B",       firedAt: now - 1000 * 60 * 1,  source: "MANUAL",    operator: "K. Rauma",     status: "FIRED",     family: "MATCH_FLOW",     departments: ["LED", "GRAPHICS", "AUDIO", "LIGHTING"] },
  { id: "h13", cueNumber: "AD-116", cueName: "Post-map Bumper",        firedAt: now - 1000 * 30,      source: "AUTOMATED", automationLabel: "STATE",   status: "FIRED",     family: "BROADCAST_FLOW", departments: ["GRAPHICS", "AUDIO"] },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function fmtRelative(ts: number, ref: number) {
  const s = Math.max(0, Math.round((ref - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

const STATUS_META: Record<
  CueHistoryStatus,
  { label: string; dot: string; text: string; ring: string; Icon: typeof CheckCircle2 }
> = {
  FIRED:     { label: "Fired",     dot: "bg-emerald-500", text: "text-emerald-400", ring: "ring-emerald-500/30",   Icon: CheckCircle2 },
  RECOVERED: { label: "Recovered", dot: "bg-cyan-400",    text: "text-cyan-300",    ring: "ring-cyan-400/30",      Icon: RotateCcw },
  WARNING:   { label: "Warning",   dot: "bg-amber-400",   text: "text-amber-300",   ring: "ring-amber-400/40",     Icon: AlertTriangle },
  SKIPPED:   { label: "Skipped",   dot: "bg-zinc-500",    text: "text-zinc-400",    ring: "ring-zinc-500/30",      Icon: SkipForward },
  FAILED:    { label: "Failed",    dot: "bg-red-500",     text: "text-red-300",     ring: "ring-red-500/60",       Icon: XCircle },
};

const ALL_STATUSES: CueHistoryStatus[] = ["FIRED", "RECOVERED", "WARNING", "SKIPPED", "FAILED"];

// ── Subcomponents ──────────────────────────────────────────────────────────
function SyncIndicator({ status }: { status: CueHistorySyncStatus }) {
  const map = {
    SYNCED:  { Icon: Wifi,    text: "Synced",  cls: "text-emerald-400" },
    SYNCING: { Icon: Loader2, text: "Syncing", cls: "text-cyan-300 animate-spin" },
    OFFLINE: { Icon: WifiOff, text: "Offline", cls: "text-amber-400" },
  } as const;
  const { Icon, text, cls } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      <Icon className={cn("h-3.5 w-3.5", cls)} />
      <span className={cn(status === "OFFLINE" && "text-amber-400")}>{text}</span>
    </span>
  );
}

function CueChip({
  item,
  onInspect,
  compact = false,
}: {
  item: CueHistoryItem;
  onInspect?: (i: CueHistoryItem) => void;
  compact?: boolean;
}) {
  const meta = STATUS_META[item.status];
  const isManual = item.source === "MANUAL";
  const SourceIcon = isManual ? User : Bot;
  const isFailed = item.status === "FAILED";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => onInspect?.(item)}
          className={cn(
            "group relative shrink-0 flex items-stretch gap-0 rounded-md border bg-card/60 text-left",
            "transition hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isManual ? "border-l-2 border-l-sky-400/70" : "border-l-2 border-l-violet-400/70",
            "border-panel-edge",
            isFailed && "border-red-500/70 ring-1 ring-red-500/40",
            compact ? "h-12" : "h-14",
          )}
          style={{ minWidth: compact ? 168 : 196 }}
        >
          <div className="flex flex-col justify-between px-2.5 py-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                {item.cueNumber}
              </span>
              <span className="truncate text-[12px] font-medium text-foreground">
                {item.cueName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 truncate">
                <SourceIcon className={cn("h-3 w-3", isManual ? "text-sky-300" : "text-violet-300")} />
                <span className="truncate">
                  {isManual ? item.operator ?? "Operator" : item.automationLabel ?? "Auto"}
                </span>
              </span>
              <span className="font-mono shrink-0">{fmtTime(item.firedAt)}</span>
            </div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-72 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{item.cueNumber}</span>
              <span className={cn("inline-flex items-center gap-1 text-[11px]", meta.text)}>
                <meta.Icon className="h-3 w-3" />
                {meta.label}
              </span>
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground truncate">
              {item.cueName}
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide border",
              isManual
                ? "border-sky-400/40 text-sky-300 bg-sky-400/10"
                : "border-violet-400/40 text-violet-300 bg-violet-400/10",
            )}
          >
            {isManual ? "Manual" : "Automated"}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div className="text-muted-foreground">Source</div>
          <div className="text-foreground truncate">
            {isManual ? item.operator ?? "—" : item.automationLabel ?? "—"}
          </div>
          <div className="text-muted-foreground">Fired</div>
          <div className="text-foreground font-mono">
            {fmtTime(item.firedAt)} <span className="text-muted-foreground">· {fmtRelative(item.firedAt, Date.now())}</span>
          </div>
          {item.family && (
            <>
              <div className="text-muted-foreground">Family</div>
              <div className="text-foreground">{item.family}</div>
            </>
          )}
          {item.departments && item.departments.length > 0 && (
            <>
              <div className="text-muted-foreground">Routed</div>
              <div className="text-foreground truncate">{item.departments.join(", ")}</div>
            </>
          )}
          {item.note && (
            <>
              <div className="text-muted-foreground">Note</div>
              <div className="text-foreground">{item.note}</div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function CueHistoryFooter({
  items = MOCK_HISTORY,
  syncStatus = "SYNCED",
  loading = false,
  liveActive = true,
  onInspect,
  onExpandedChange,
}: CueHistoryFooterProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | CueHistorySource>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CueHistoryStatus>("ALL");
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Sorted newest-last so it reads left → right with newest on the right.
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.firedAt - b.firedAt),
    [items],
  );

  // Auto-scroll the strip to the right when new items arrive.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [sorted.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted
      .filter((i) => (sourceFilter === "ALL" ? true : i.source === sourceFilter))
      .filter((i) => (statusFilter === "ALL" ? true : i.status === statusFilter))
      .filter((i) => {
        if (!q) return true;
        return (
          i.cueName.toLowerCase().includes(q) ||
          i.cueNumber.toLowerCase().includes(q) ||
          (i.operator ?? "").toLowerCase().includes(q) ||
          (i.automationLabel ?? "").toLowerCase().includes(q)
        );
      })
      .slice()
      .reverse(); // newest first in table view
  }, [sorted, search, sourceFilter, statusFilter]);

  const toggleExpanded = () => {
    setExpanded((v) => {
      const next = !v;
      onExpandedChange?.(next);
      return next;
    });
  };

  const isEmpty = !loading && items.length === 0;

  return (
    <>
      <footer
        className={cn(
          "shrink-0 border-t border-panel-edge bg-card/40 backdrop-blur-sm",
          "flex items-center gap-2 px-2 h-16",
        )}
        aria-label="AD cue history timeline"
      >
        {/* Left label / live indicator */}
        <div className="flex items-center gap-2 pr-2 border-r border-panel-edge h-full">
          <div className="flex items-center gap-1.5 px-1">
            <History className="h-4 w-4 text-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              AD History
            </span>
          </div>
          <div className="flex flex-col items-start gap-0.5 pr-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] uppercase tracking-wide",
                liveActive ? "text-red-400" : "text-muted-foreground",
              )}
            >
              <CircleDot className={cn("h-2.5 w-2.5", liveActive && "animate-pulse")} />
              {liveActive ? "Live" : "Idle"}
            </span>
            <SyncIndicator status={loading ? "SYNCING" : syncStatus} />
          </div>
        </div>

        {/* Timeline strip */}
        <div className="relative flex-1 min-w-0 h-full">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card/80 to-transparent z-10" />

          {loading ? (
            <div className="flex h-full items-center gap-2 px-3 text-[12px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Syncing AD cue history…
            </div>
          ) : isEmpty ? (
            <div className="flex h-full items-center px-3 text-[12px] text-muted-foreground">
              No AD cues fired yet. Fired cues will appear here in real time.
            </div>
          ) : (
            <div
              ref={scrollerRef}
              className="flex h-full items-center gap-1.5 overflow-x-auto overflow-y-hidden px-2 scroll-smooth
                         [scrollbar-width:thin]"
            >
              {sorted.map((item) => (
                <CueChip key={item.id} item={item} onInspect={onInspect} compact />
              ))}
              {/* "Now" marker on the right */}
              <div className="shrink-0 ml-1 flex flex-col items-center justify-center px-2 h-full border-l border-dashed border-panel-edge">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Now
                </span>
                <span className="font-mono text-[10px] text-foreground">{fmtTime(Date.now())}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 pl-2 border-l border-panel-edge h-full">
          <span className="hidden md:inline text-[10px] text-muted-foreground pr-1">
            {items.length} cues
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-8 px-2 text-[11px] uppercase tracking-wide"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
            )}
            Expand
          </Button>
        </div>
      </footer>

      {/* Expanded drawer */}
      <Sheet open={expanded} onOpenChange={(o) => { setExpanded(o); onExpandedChange?.(o); }}>
        <SheetContent
          side="bottom"
          className="h-[70vh] p-0 flex flex-col bg-background border-panel-edge"
        >
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-panel-edge">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <SheetTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                AD Cue History
                <span className="text-xs font-normal text-muted-foreground">
                  ({filtered.length} of {items.length})
                </span>
              </SheetTitle>
              <div className="flex items-center gap-2">
                <SyncIndicator status={loading ? "SYNCING" : syncStatus} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cue name, number, or operator…"
                  className="h-8 pl-7 pr-7 text-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <FilterPills
                label="Source"
                value={sourceFilter}
                options={[
                  { value: "ALL", label: "All" },
                  { value: "MANUAL", label: "Manual" },
                  { value: "AUTOMATED", label: "Automated" },
                ]}
                onChange={(v) => setSourceFilter(v as typeof sourceFilter)}
              />
              <FilterPills
                label="Status"
                value={statusFilter}
                options={[
                  { value: "ALL", label: "All" },
                  ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })),
                ]}
                onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              />
              {(search || sourceFilter !== "ALL" || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    setSearch("");
                    setSourceFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-auto">
            {filtered.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No AD cues match the current filters.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background/95 backdrop-blur border-b border-panel-edge text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 w-20">Cue #</th>
                    <th className="text-left font-medium px-2 py-2">Name</th>
                    <th className="text-left font-medium px-2 py-2 w-24">Source</th>
                    <th className="text-left font-medium px-2 py-2 w-36">Operator / System</th>
                    <th className="text-left font-medium px-2 py-2 w-28">Status</th>
                    <th className="text-left font-medium px-2 py-2 w-36">Routed</th>
                    <th className="text-left font-medium px-2 py-2 w-28">Fired</th>
                    <th className="text-left font-medium px-2 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const meta = STATUS_META[item.status];
                    const isManual = item.source === "MANUAL";
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onInspect?.(item)}
                        className={cn(
                          "border-b border-panel-edge/60 hover:bg-card/60 cursor-pointer",
                          item.status === "FAILED" && "bg-red-500/5",
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-muted-foreground">{item.cueNumber}</td>
                        <td className="px-2 py-2 text-foreground font-medium">{item.cueName}</td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide border",
                              isManual
                                ? "border-sky-400/40 text-sky-300 bg-sky-400/10"
                                : "border-violet-400/40 text-violet-300 bg-violet-400/10",
                            )}
                          >
                            {isManual ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                            {isManual ? "Manual" : "Auto"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-foreground truncate">
                          {isManual ? item.operator ?? "—" : item.automationLabel ?? "—"}
                        </td>
                        <td className="px-2 py-2">
                          <span className={cn("inline-flex items-center gap-1", meta.text)}>
                            <meta.Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground truncate">
                          {item.departments?.join(", ") ?? "—"}
                        </td>
                        <td className="px-2 py-2 font-mono text-muted-foreground">
                          {fmtTime(item.firedAt)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground truncate">
                          {item.note ?? ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterPills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground pr-1">
        {label}
      </span>
      <div className="inline-flex rounded-md border border-panel-edge overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-2 h-7 text-[11px] transition border-r border-panel-edge last:border-r-0",
              value === opt.value
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-card/60",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
