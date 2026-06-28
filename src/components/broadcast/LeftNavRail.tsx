import { Link } from "@tanstack/react-router";
import {
  Activity,
  Clock,
  GitBranch,
  Radio,
  ScrollText,
  Trophy,
  Workflow,
  Wrench,
} from "lucide-react";

type NavId =
  | "ad"
  | "automation"
  | "timing"
  | "league"
  | "routing"
  | "outputs"
  | "logs"
  | "engineering";

const items: {
  id: NavId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  to?: string;
}[] = [
  { id: "ad", label: "AD Control", icon: Radio, enabled: true, to: "/" },
  { id: "automation", label: "Automation", icon: Workflow, enabled: true, to: "/automation-triggers" },
  { id: "engineering", label: "Engineering", icon: Wrench, enabled: true, to: "/engineering" },
  { id: "timing", label: "Timing", icon: Clock, enabled: false },
  { id: "league", label: "League Ops", icon: Trophy, enabled: false },
  { id: "routing", label: "Routing", icon: GitBranch, enabled: false },
  { id: "outputs", label: "Outputs", icon: Activity, enabled: false },
  { id: "logs", label: "Logs", icon: ScrollText, enabled: false },
];

export function LeftNavRail({ active = "ad" as NavId }: { active?: NavId }) {
  return (
    <nav className="w-[72px] shrink-0 border-r border-panel-edge bg-panel flex flex-col items-stretch py-2">
      <div className="px-2 pb-2 border-b border-panel-edge mb-2 text-center">
        <div className="text-[9px] font-bold tracking-[0.18em] text-accent">LVCTRL</div>
        <div className="text-[9px] text-muted-foreground mt-0.5">v4.2</div>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        const className = `mx-1.5 my-0.5 flex flex-col items-center justify-center gap-1 py-2.5 rounded-sm relative transition-colors ${
          isActive
            ? "bg-accent/15 text-accent"
            : item.enabled
              ? "text-foreground/80 hover:bg-panel-elev"
              : "text-muted-foreground/40 cursor-not-allowed"
        }`;
        const inner = (
          <>
            {isActive && (
              <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-accent rounded-r" />
            )}
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-[9px] uppercase tracking-wider leading-none text-center">
              {item.label}
            </span>
          </>
        );
        if (item.enabled && item.to) {
          return (
            <Link key={item.id} to={item.to} className={className} title={item.label}>
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={item.id}
            disabled={!item.enabled}
            className={className}
            title={item.enabled ? item.label : `${item.label} (disabled)`}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
