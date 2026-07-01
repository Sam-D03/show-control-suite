import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPage, Panel, StatusPill } from "@/components/admin/AdminShell";
import { mockAudit, type AuditType } from "@/lib/admin/mockData";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

const TYPES: AuditType[] = [
  "login",
  "team.role.changed",
  "bridge.paired",
  "bridge.credential.rotated",
  "lease.renewed",
  "remote.command.ack",
  "remote.command.failed",
];

function AuditPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<AuditType | "all">("all");
  const [actor, setActor] = useState("all");
  const [event, setEvent] = useState("all");

  const actors = Array.from(new Set(mockAudit.map((a) => a.actor)));
  const events = Array.from(
    new Set(mockAudit.map((a) => a.event).filter(Boolean) as string[]),
  );

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return mockAudit.filter(
      (a) =>
        (type === "all" || a.type === type) &&
        (actor === "all" || a.actor === actor) &&
        (event === "all" || a.event === event) &&
        (!ql ||
          a.detail.toLowerCase().includes(ql) ||
          a.actor.toLowerCase().includes(ql) ||
          a.type.toLowerCase().includes(ql)),
    );
  }, [q, type, actor, event]);

  return (
    <AdminPage
      title="Audit Log"
      description="Immutable record of account-level activity. Cue-fire history for individual events lives on the Control Surface footer."
      actions={
        <Button size="sm" variant="outline">
          <Download /> Export CSV
        </Button>
      }
    >
      <Panel title="Filters">
        <div className="flex flex-wrap gap-2">
          <Input
            className="h-8 w-56"
            placeholder="Search detail, actor, type…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={type} onChange={(v) => setType(v as AuditType | "all")}>
            <option value="all">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={actor} onChange={setActor}>
            <option value="all">All actors</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Select value={event} onChange={setEvent}>
            <option value="all">All events</option>
            {events.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
          <Input type="date" className="h-8 w-40" />
        </div>
      </Panel>

      <Panel title={`Events (${rows.length})`}>
        {rows.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-muted-foreground">
            No audit events match the current filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-panel-edge">
                <TableHead className="w-[170px]">Timestamp</TableHead>
                <TableHead className="w-[180px]">Type</TableHead>
                <TableHead className="w-[140px]">Actor</TableHead>
                <TableHead className="w-[180px]">Event</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="border-panel-edge">
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {r.ts}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={typeTone(r.type)}>{r.type}</StatusPill>
                  </TableCell>
                  <TableCell className="text-[12px]">{r.actor}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    {r.event ?? "—"}
                  </TableCell>
                  <TableCell className="text-[12px]">{r.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </AdminPage>
  );
}

function typeTone(t: AuditType): "ok" | "warn" | "error" | "info" | "muted" {
  if (t === "remote.command.failed") return "error";
  if (t === "remote.command.ack") return "ok";
  if (t === "bridge.credential.rotated" || t === "team.role.changed") return "warn";
  if (t === "login" || t === "bridge.paired") return "info";
  return "muted";
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      className="h-8 rounded-md border border-input bg-background px-2 text-[12px]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}
