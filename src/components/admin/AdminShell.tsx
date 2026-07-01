import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Cable,
  ClipboardList,
  Cloud,
  LayoutGrid,
  Network,
  Radio,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockActiveEvent, mockTeam, mockUser } from "@/lib/admin/mockData";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/admin/team", label: "Team", icon: ShieldCheck },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/events", label: "Events", icon: Radio },
  { to: "/admin/lan", label: "LAN Instances", icon: Network },
  { to: "/admin/bridges", label: "Bridge Devices", icon: Cable },
  { to: "/admin/lease", label: "Lease", icon: Timer },
  { to: "/admin/audit", label: "Audit Log", icon: ClipboardList },
];

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top account bar */}
      <header className="h-11 shrink-0 border-b border-panel-edge bg-panel flex items-center px-3 gap-3 text-[12px]">
        <div className="flex items-center gap-2 font-semibold tracking-wide">
          <Cloud className="h-4 w-4 text-accent" />
          <span>CONTROL 2.0</span>
          <span className="text-muted-foreground font-normal">/ Cloud Admin</span>
        </div>

        <div className="mx-3 h-5 w-px bg-panel-edge" />

        <StatChip label="TEAM" value={mockTeam.name} />
        <StatChip label="EVENT" value={mockActiveEvent.name} accent />
        <StatChip label="AUTHORITY" value={mockActiveEvent.authority} />

        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/"
            className="rounded-sm border border-panel-edge px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
          >
            Open Control Surface →
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight">
              <div className="text-foreground">{mockUser.name}</div>
              <div className="text-[10px] text-muted-foreground">{mockUser.email}</div>
            </div>
            <Badge variant="outline" className="border-accent/50 text-accent">
              {mockUser.role}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Left nav */}
        <nav className="w-[196px] shrink-0 border-r border-panel-edge bg-panel flex flex-col">
          <div className="px-3 py-2 text-[10px] tracking-widest uppercase text-muted-foreground">
            Account
          </div>
          <ul className="flex-1 overflow-y-auto">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-[13px] border-l-2 transition-colors",
                      active
                        ? "border-accent bg-panel-elev text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-panel-elev/60",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-panel-edge px-3 py-2 text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-status-ok" />
            Cloud services nominal
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] tracking-widest text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium",
          accent ? "text-accent" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="text-[12px] text-muted-foreground mt-0.5 max-w-2xl">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Panel({
  title,
  right,
  className,
  children,
}: {
  title?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-panel-edge bg-panel",
        className,
      )}
    >
      {title || right ? (
        <header className="flex items-center justify-between border-b border-panel-edge px-3 py-2">
          <h2 className="text-[11px] tracking-widest uppercase text-muted-foreground">
            {title}
          </h2>
          {right}
        </header>
      ) : null}
      <div className="p-3">{children}</div>
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "error" | "info" | "muted";
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    ok: "bg-status-ok/15 text-status-ok border-status-ok/40",
    warn: "bg-status-warn/15 text-status-warn border-status-warn/40",
    error: "bg-status-error/15 text-status-error border-status-error/40",
    info: "bg-status-info/15 text-status-info border-status-info/40",
    muted: "bg-muted/40 text-muted-foreground border-panel-edge",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
        map[tone],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "ok" && "bg-status-ok",
          tone === "warn" && "bg-status-warn",
          tone === "error" && "bg-status-error",
          tone === "info" && "bg-status-info",
          tone === "muted" && "bg-muted-foreground",
        )}
      />
      {children}
    </span>
  );
}

export function bridgeTone(s: string): "ok" | "warn" | "error" | "muted" {
  if (s === "Online") return "ok";
  if (s === "Degraded") return "warn";
  if (s === "Offline") return "error";
  return "muted";
}
