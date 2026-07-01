import { createFileRoute } from "@tanstack/react-router";
import { Check, KeyRound, Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { mockBridges, type BridgeDevice } from "@/lib/admin/mockData";

export const Route = createFileRoute("/admin/bridges")({
  component: BridgesPage,
});

const STEPS = [
  "Pairing code",
  "Select team / event",
  "Approve bridge",
  "Success",
] as const;

function BridgesPage() {
  const [bridges, setBridges] = useState<BridgeDevice[]>(mockBridges);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rotateFor, setRotateFor] = useState<BridgeDevice | null>(null);
  const [revokeFor, setRevokeFor] = useState<BridgeDevice | null>(null);

  const startWizard = () => {
    setStep(0);
    setWizardOpen(true);
  };

  return (
    <AdminPage
      title="Bridge Devices"
      description="Bridges pair a LAN Control instance to the cloud with a machine identity. Admin sessions are never stored on the LAN box."
      actions={
        <Button size="sm" onClick={startWizard}>
          <Plus /> Register LAN Bridge
        </Button>
      }
    >
      <div className="rounded-md border border-panel-edge bg-panel-elev/40 px-3 py-2 text-[11px] flex items-center gap-2 text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5 text-status-warn" />
        Bridges run as role <strong className="text-foreground mx-1">BRIDGE</strong>
        (machine identity). This role is separate from user roles and cannot receive
        Team Owner or CDEV permissions.
      </div>

      <Panel title={`Bridges (${bridges.length})`}>
        <Table>
          <TableHeader>
            <TableRow className="border-panel-edge">
              <TableHead>Bridge</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Event scopes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead>Credential</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bridges.map((b) => (
              <TableRow key={b.id} className="border-panel-edge">
                <TableCell>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {b.id}
                  </div>
                </TableCell>
                <TableCell className="text-[12px]">{b.team}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">
                  {b.eventScopes.length ? b.eventScopes.join(", ") : "—"}
                </TableCell>
                <TableCell>
                  <StatusPill tone={bridgeTone(b.status)}>{b.status}</StatusPill>
                </TableCell>
                <TableCell className="tabular text-muted-foreground">
                  {b.lastSeen}
                </TableCell>
                <TableCell>
                  <StatusPill
                    tone={
                      b.credential === "Healthy"
                        ? "ok"
                        : b.credential === "Rotate soon"
                          ? "warn"
                          : "error"
                    }
                  >
                    {b.credential}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setRotateFor(b)}>
                    <KeyRound /> Rotate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 text-destructive hover:text-destructive"
                    onClick={() => setRevokeFor(b)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      {/* Register wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Register LAN Bridge</DialogTitle>
            <DialogDescription>Step {step + 1} of {STEPS.length} — {STEPS[step]}</DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <ol className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={`h-5 w-5 grid place-items-center rounded-full border ${
                    i < step
                      ? "bg-status-ok/20 border-status-ok text-status-ok"
                      : i === step
                        ? "border-accent text-accent"
                        : "border-panel-edge text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span
                  className={
                    i === step ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {s}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-2 min-h-[140px] rounded-md border border-panel-edge bg-panel-elev/40 p-4 text-[12px]">
            {step === 0 && (
              <div className="space-y-2">
                <p>Enter the pairing code shown in the LAN app, or scan the QR.</p>
                <Input placeholder="XXXX-XXXX" className="font-mono tracking-widest" />
              </div>
            )}
            {step === 1 && (
              <div className="space-y-2">
                <Label>Team</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                  <option>Northlight Broadcast</option>
                </select>
                <Label className="mt-2 block">Event scope</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                  <option>All team events</option>
                  <option>CS2 Major — Stage 1</option>
                  <option>EU Qualifier — Week 4</option>
                </select>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-1">
                <p>Confirm bridge fingerprint:</p>
                <p className="font-mono text-[11px] text-accent">
                  SHA256:9f34…c2ab · issued to Truck-3 Bridge
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Approving issues a machine credential. Admin session is not
                  transferred to the LAN box.
                </p>
              </div>
            )}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center text-center gap-2 py-2">
                <Check className="h-6 w-6 text-status-ok" />
                <div className="font-medium">Bridge registered</div>
                <div className="text-muted-foreground text-[11px]">
                  The bridge can now run under machine identity.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {step > 0 && step < STEPS.length - 1 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                {step === STEPS.length - 2 ? "Approve" : "Continue"}
              </Button>
            ) : (
              <Button onClick={() => setWizardOpen(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate */}
      <Dialog open={!!rotateFor} onOpenChange={(o) => !o && setRotateFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rotate credential — {rotateFor?.name}</DialogTitle>
            <DialogDescription>
              The bridge will re-authenticate on next heartbeat. Brief downtime
              possible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRotateFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (rotateFor)
                  setBridges((prev) =>
                    prev.map((x) =>
                      x.id === rotateFor.id ? { ...x, credential: "Healthy" } : x,
                    ),
                  );
                setRotateFor(null);
              }}
            >
              Rotate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke */}
      <Dialog open={!!revokeFor} onOpenChange={(o) => !o && setRevokeFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke {revokeFor?.name}?</DialogTitle>
            <DialogDescription>
              The bridge will be disconnected immediately and cannot re-pair without a
              new code.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeFor(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (revokeFor)
                  setBridges((prev) =>
                    prev.map((x) =>
                      x.id === revokeFor.id
                        ? { ...x, status: "Offline", credential: "Revoked" }
                        : x,
                    ),
                  );
                setRevokeFor(null);
              }}
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
