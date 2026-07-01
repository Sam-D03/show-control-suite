import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Cable,
  CalendarClock,
  Cloud,
  ExternalLink,
  Network,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminPage, Panel, StatusPill } from "@/components/admin/AdminShell";
import {
  mockActiveEvent,
  mockLease,
  mockTeam,
  mockUser,
} from "@/lib/admin/mockData";

export const Route = createFileRoute("/admin/")({
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <AdminPage
      title="Account Overview"
      description="Signed-in identity, active scope, and cloud service health for this operator session."
    >
      {/* Identity + scope row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Signed-in User">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-panel-elev border border-panel-edge grid place-items-center text-sm font-semibold">
              {mockUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{mockUser.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {mockUser.email}
              </div>
              <div className="mt-1">
                <StatusPill tone="info">{mockUser.role}</StatusPill>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Active Team">
          <div className="text-sm font-medium">{mockTeam.name}</div>
          <div className="text-[11px] text-muted-foreground">
            Owner: {mockTeam.owner} · {mockTeam.seats} seats · Plan {mockTeam.plan}
          </div>
          <div className="mt-2 flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/team">
                <ShieldCheck /> Manage team
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/members">
                <Users /> Members
              </Link>
            </Button>
          </div>
        </Panel>

        <Panel title="Active Event">
          <div className="text-sm font-medium">{mockActiveEvent.name}</div>
          <div className="text-[11px] text-muted-foreground">
            Authority: {mockActiveEvent.authority}
          </div>
          <div className="mt-2 flex gap-2">
            <Button asChild size="sm">
              <Link to="/">
                <ExternalLink /> Open Control Surface
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/events">
                <Radio /> Events
              </Link>
            </Button>
          </div>
        </Panel>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusCard
          icon={Cloud}
          label="Cloud auth"
          value="Active"
          tone="ok"
          sub="Session valid · Clerk"
        />
        <StatusCard
          icon={CalendarClock}
          label="LAN entitlement lease"
          value={`${mockLease.daysRemaining} days remaining`}
          tone={
            mockLease.state === "expired"
              ? "error"
              : mockLease.state === "warning"
                ? "warn"
                : "ok"
          }
          sub={`Valid until ${mockLease.validUntil}`}
        />
        <StatusCard
          icon={Cable}
          label="Bridge status"
          value="2 online · 1 degraded"
          tone="warn"
          sub="Truck-3 heartbeat delayed"
        />
        <StatusCard
          icon={Network}
          label="Event authority"
          value="LAN-primary"
          tone="info"
          sub="Cloud mirror follows LAN"
        />
      </div>

      {/* Quick actions */}
      <Panel title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/">
              <ExternalLink /> Open Control Surface
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/team">
              <ShieldCheck /> Manage Team
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/events">
              <Radio /> Manage Events
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/bridges">
              <Cable /> Register LAN Bridge
            </Link>
          </Button>
        </div>
      </Panel>
    </AdminPage>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: "ok" | "warn" | "error" | "info";
}) {
  return (
    <div className="rounded-lg border border-panel-edge bg-panel px-3 py-2.5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <StatusPill tone={tone}>{tone}</StatusPill>
      </div>
      <div className="text-sm font-medium tabular">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
