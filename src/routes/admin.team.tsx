import { createFileRoute } from "@tanstack/react-router";
import { Save, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPage, Panel, StatusPill } from "@/components/admin/AdminShell";
import { mockTeam, mockUser } from "@/lib/admin/mockData";

export const Route = createFileRoute("/admin/team")({
  component: TeamPage,
});

function TeamPage() {
  const [name, setName] = useState(mockTeam.name);
  const [slug, setSlug] = useState(mockTeam.slug);
  const [dirty, setDirty] = useState(false);

  return (
    <AdminPage
      title="Team Settings"
      description="Profile and ownership for the currently active team. One owned team per user."
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={!dirty}
            onClick={() => {
              setName(mockTeam.name);
              setSlug(mockTeam.slug);
              setDirty(false);
            }}
          >
            <X /> Cancel
          </Button>
          <Button size="sm" disabled={!dirty} onClick={() => setDirty(false)}>
            <Save /> Save changes
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Profile" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Team name">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDirty(true);
                }}
              />
            </Field>
            <Field label="Slug" hint="Used in URLs and bridge identifiers.">
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase());
                  setDirty(true);
                }}
              />
            </Field>
            <Field label="Region">
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                <option>Auto (nearest edge)</option>
                <option>EU West</option>
                <option>US East</option>
                <option>APAC</option>
              </select>
            </Field>
            <Field label="Support contact">
              <Input placeholder="ops@team.gg" />
            </Field>
          </div>
        </Panel>

        <Panel title="Ownership">
          <dl className="text-[12px] space-y-2">
            <Row k="Owner" v={mockTeam.owner} />
            <Row k="Created" v={mockTeam.createdAt} />
            <Row k="Team ID" v={mockTeam.id} mono />
            <Row
              k="Ownership rule"
              v={
                <span className="text-muted-foreground">
                  Each user owns at most one team. Transfer required to change owner.
                </span>
              }
            />
          </dl>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" disabled>
              Transfer ownership
            </Button>
          </div>
          {mockUser.role !== "Team Owner" ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Ownership changes require the current Team Owner.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Plan & Billing"
          className="lg:col-span-3"
          right={<StatusPill tone="info">Future billing</StatusPill>}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
            <div className="rounded-md border border-panel-edge p-3 bg-panel-elev/40">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Plan
              </div>
              <div className="text-sm font-medium mt-1">{mockTeam.plan}</div>
              <div className="text-muted-foreground mt-1">
                Billing is not enabled in this preview.
              </div>
            </div>
            <div className="rounded-md border border-panel-edge p-3 bg-panel-elev/40">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Seats
              </div>
              <div className="text-sm font-medium mt-1">
                {mockTeam.seats} included
              </div>
              <div className="text-muted-foreground mt-1">
                Includes CDEV, Owner, Producer, Operator, Tournament Ops, Viewer roles.
              </div>
            </div>
            <div className="rounded-md border border-panel-edge p-3 bg-panel-elev/40">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Renewal
              </div>
              <div className="text-sm font-medium mt-1">—</div>
              <div className="text-muted-foreground mt-1">
                Wire in when billing ships.
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Row({
  k,
  v,
  mono,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-panel-edge/60 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
        {k}
      </dt>
      <dd className={mono ? "font-mono text-[11px]" : ""}>{v}</dd>
    </div>
  );
}
