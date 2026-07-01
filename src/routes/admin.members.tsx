import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, ShieldOff, UserCog, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPage, Panel, StatusPill } from "@/components/admin/AdminShell";
import {
  mockMembers,
  ROLES,
  ROLE_RANK,
  ROLE_SUMMARY,
  type Member,
  type Role,
} from "@/lib/admin/mockData";

export const Route = createFileRoute("/admin/members")({
  component: MembersPage,
});

function MembersPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleFor, setRoleFor] = useState<Member | null>(null);
  const [removeFor, setRemoveFor] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <AdminPage
      title="Members & Roles"
      description="Team members, their role, and last activity. Roles are strict — no custom roles."
      actions={
        <>
          <Input
            className="h-8 w-56"
            placeholder="Search name, email, role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus /> Invite member
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3">
        <Panel title={`Members (${filtered.length})`} className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-panel-edge">
                <TableHead className="w-[26%]">Name</TableHead>
                <TableHead className="w-[24%]">Email</TableHead>
                <TableHead className="w-[16%]">Role</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[14%]">Last active</TableHead>
                <TableHead className="w-[8%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} className="border-panel-edge">
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={m.role} />
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      tone={
                        m.status === "Active"
                          ? "ok"
                          : m.status === "Invited"
                            ? "info"
                            : "muted"
                      }
                    >
                      {m.status}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular">
                    {m.lastActive}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setRoleFor(m)}>
                          <UserCog className="mr-2 h-4 w-4" /> Change role…
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            setMembers((prev) =>
                              prev.map((x) =>
                                x.id === m.id
                                  ? { ...x, status: x.status === "Disabled" ? "Active" : "Disabled" }
                                  : x,
                              ),
                            )
                          }
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          {m.status === "Disabled" ? "Re-enable" : "Disable"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setRemoveFor(m)}
                        >
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Role hierarchy">
          <ol className="space-y-1.5">
            {[...ROLES].sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a]).map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-2 rounded-md border border-panel-edge bg-panel-elev/40 px-2 py-1.5"
              >
                <span className="text-[10px] font-mono text-muted-foreground w-4 pt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={r} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ROLE_SUMMARY[r]}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Higher role always includes lower-role permissions. CDEV is platform staff and
            spans all teams.
          </p>
        </Panel>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              An invitation email will be sent when backend delivery is enabled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input placeholder="name@team.gg" />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                {ROLES.filter((r) => r !== "CDEV").map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Event access (optional)</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                <option>All team events</option>
                <option>CS2 Major — Stage 1</option>
                <option>EU Qualifier — Week 4</option>
                <option>Studio Rehearsal</option>
              </select>
              <p className="text-[10px] text-muted-foreground">
                Placeholder — per-event scoping wires in with backend.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setInviteOpen(false)}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={!!roleFor} onOpenChange={(o) => !o && setRoleFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change role — {roleFor?.name}</DialogTitle>
            <DialogDescription>
              Current role: <strong>{roleFor?.role}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>New role</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              defaultValue={roleFor?.role}
              onChange={(e) => {
                if (!roleFor) return;
                const nr = e.target.value as Role;
                setMembers((prev) =>
                  prev.map((x) => (x.id === roleFor.id ? { ...x, role: nr } : x)),
                );
              }}
            >
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button onClick={() => setRoleFor(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove dialog */}
      <Dialog open={!!removeFor} onOpenChange={(o) => !o && setRemoveFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {removeFor?.name}?</DialogTitle>
            <DialogDescription>
              They will lose access immediately. Audit entries are retained.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoveFor(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeFor)
                  setMembers((prev) => prev.filter((x) => x.id !== removeFor.id));
                setRemoveFor(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const tone: Record<Role, string> = {
    CDEV: "text-accent border-accent/50 bg-accent/10",
    "Team Owner": "text-primary border-primary/50 bg-primary/10",
    Producer: "text-status-info border-status-info/40 bg-status-info/10",
    Operator: "text-status-ok border-status-ok/40 bg-status-ok/10",
    "Tournament Ops": "text-status-warn border-status-warn/40 bg-status-warn/10",
    Viewer: "text-muted-foreground border-panel-edge bg-muted/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${tone[role]}`}
    >
      {role}
    </span>
  );
}
