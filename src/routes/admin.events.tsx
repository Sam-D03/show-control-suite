import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, Lock, Plus, Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminPage,
  Panel,
  StatusPill,
  bridgeTone,
} from "@/components/admin/AdminShell";
import {
  mockActiveEvent,
  mockEvents,
  type EventRow,
} from "@/lib/admin/mockData";

export const Route = createFileRoute("/admin/events")({
  component: EventsPage,
});

const AUTHORITY_MODES = [
  "LAN-only (cloud auth)",
  "LAN-primary (cloud mirror)",
  "Cloud-primary",
] as const;

function EventsPage() {
  const [events] = useState<EventRow[]>(mockEvents);
  const [active, setActive] = useState(mockActiveEvent.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerFor, setDrawerFor] = useState<EventRow | null>(null);

  return (
    <AdminPage
      title="Events"
      description="Events owned by this team. Set the active event to scope Control Surface and Bridges."
      actions={
        <>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
              Active
            </span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={active}
              onChange={(e) => setActive(e.target.value)}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Create event
          </Button>
        </>
      }
    >
      <Panel title={`Events (${events.length})`}>
        <Table>
          <TableHeader>
            <TableRow className="border-panel-edge">
              <TableHead>Event</TableHead>
              <TableHead>Authority mode</TableHead>
              <TableHead>Bridge</TableHead>
              <TableHead>LAN instances</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead>Outputs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id} className="border-panel-edge">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {active === e.id ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="font-medium">{e.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[12px]">{e.authority}</TableCell>
                <TableCell>
                  <StatusPill tone={bridgeTone(e.bridge)}>{e.bridge}</StatusPill>
                </TableCell>
                <TableCell className="tabular">{e.lanInstances}</TableCell>
                <TableCell className="text-muted-foreground tabular">
                  {e.lastActivity}
                </TableCell>
                <TableCell>
                  {e.outputsLocked ? (
                    <StatusPill tone="warn">
                      <Lock className="h-3 w-3" /> Locked
                    </StatusPill>
                  ) : (
                    <StatusPill tone="muted">Unlocked</StatusPill>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDrawerFor(e)}
                  >
                    <Settings2 /> Settings
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      {/* Create event dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create event</DialogTitle>
            <DialogDescription>
              Choose an authority mode. This can be changed later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input placeholder="e.g. Autumn Invitational — Playoffs" />
            </div>
            <div className="space-y-1">
              <Label>Authority mode</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                {AUTHORITY_MODES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateOpen(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event settings drawer */}
      <Sheet open={!!drawerFor} onOpenChange={(o) => !o && setDrawerFor(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{drawerFor?.name}</SheetTitle>
            <SheetDescription>Event configuration and linked surfaces.</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3 text-[12px]">
            <SubPanel title="Authority">
              <div className="flex items-center justify-between">
                <span>Mode</span>
                <span className="font-medium">{drawerFor?.authority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bridge</span>
                <StatusPill tone={bridgeTone(drawerFor?.bridge ?? "Offline")}>
                  {drawerFor?.bridge}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>Outputs locked</span>
                <span>{drawerFor?.outputsLocked ? "Yes" : "No"}</span>
              </div>
            </SubPanel>

            <SubPanel title="Linked surfaces">
              <LinkRow label="AD Control page" placeholder="/control/ad" />
              <LinkRow label="Automation page" placeholder="/control/automation" />
              <LinkRow label="Esports teams & player records" placeholder="0 rosters" />
              <LinkRow label="Match schedule calendar" placeholder="Not configured" />
              <LinkRow label="Show rundowns" placeholder="Not configured" />
            </SubPanel>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerFor(null)}>
              Close
            </Button>
            <Button size="sm">Save</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AdminPage>
  );
}

function SubPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-panel-edge bg-panel-elev/40">
      <header className="border-b border-panel-edge px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </header>
      <div className="p-3 space-y-2">{children}</div>
    </section>
  );
}

function LinkRow({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex items-center justify-between border-b border-panel-edge/60 pb-1.5 last:border-0 last:pb-0">
      <span>{label}</span>
      <span className="text-muted-foreground font-mono text-[11px]">{placeholder}</span>
    </div>
  );
}
