import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { mockLanInstances } from "@/lib/admin/mockData";

export const Route = createFileRoute("/admin/lan")({
  component: LanPage,
});

function LanPage() {
  return (
    <AdminPage
      title="LAN Instances"
      description="Rendezvous directory of Control 2.0 LAN nodes reporting to this team. This is not a network scanner — instances self-register through their bridge."
      actions={
        <Button size="sm" variant="outline">
          <RefreshCw /> Refresh directory
        </Button>
      }
    >
      <Panel title={`Instances (${mockLanInstances.length})`}>
        <Table>
          <TableHeader>
            <TableRow className="border-panel-edge">
              <TableHead>Name</TableHead>
              <TableHead>URLs</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Bridge</TableHead>
              <TableHead>Last heartbeat</TableHead>
              <TableHead>Lease</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLanInstances.map((i) => (
              <TableRow key={i.id} className="border-panel-edge align-top">
                <TableCell>
                  <div className="font-medium">{i.name}</div>
                  {i.mdns ? (
                    <div className="text-[10px] font-mono text-muted-foreground">
                      mDNS: {i.mdns}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <ul className="space-y-0.5">
                    {i.urls.map((u) => (
                      <li
                        key={u}
                        className="font-mono text-[11px] text-muted-foreground"
                      >
                        {u}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="tabular text-[12px]">{i.version}</TableCell>
                <TableCell>
                  <StatusPill tone={bridgeTone(i.bridge)}>{i.bridge}</StatusPill>
                </TableCell>
                <TableCell className="tabular text-muted-foreground">
                  {i.lastHeartbeat}
                </TableCell>
                <TableCell className="tabular text-muted-foreground">
                  {i.leaseExpires}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost">
                    <QrCode /> Pair
                  </Button>
                  <Button size="sm" variant="outline" className="ml-1">
                    <ExternalLink /> Open on LAN
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Alternate URLs">
          <p className="text-[12px] text-muted-foreground">
            When "Open on LAN" fails, operators can try any of the alternate URLs
            reported by the instance. mDNS names require Bonjour/Avahi on the
            gallery workstation.
          </p>
        </Panel>
        <Panel title="Pair a new LAN instance">
          <ol className="text-[12px] space-y-1 list-decimal list-inside text-muted-foreground">
            <li>On the LAN box, open Control 2.0 and select "Pair to cloud".</li>
            <li>Scan the QR or enter the 8-character pairing code.</li>
            <li>Approve the instance here to bind it to this team.</li>
          </ol>
          <div className="mt-2 rounded-md border border-dashed border-panel-edge p-4 text-center text-[11px] text-muted-foreground">
            [ QR / pairing UI placeholder ]
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}
