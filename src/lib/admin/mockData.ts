// Frontend-only mock data + types for Control 2.0 cloud account/admin UI.
// No backend calls. Replace with real API/queries at integration time.

export type Role =
  | "CDEV"
  | "Team Owner"
  | "Producer"
  | "Operator"
  | "Tournament Ops"
  | "Viewer";

export const ROLES: Role[] = [
  "CDEV",
  "Team Owner",
  "Producer",
  "Operator",
  "Tournament Ops",
  "Viewer",
];

export const ROLE_RANK: Record<Role, number> = {
  CDEV: 6,
  "Team Owner": 5,
  Producer: 4,
  Operator: 3,
  "Tournament Ops": 2,
  Viewer: 1,
};

export const ROLE_SUMMARY: Record<Role, string> = {
  CDEV: "Platform staff. All permissions across all teams.",
  "Team Owner": "Full team control: billing, members, events, bridges.",
  Producer: "Create/edit events, invite operators, fire cues.",
  Operator: "Run AD Control and Automation during shows.",
  "Tournament Ops": "Manage schedule, teams, players. No cue authority.",
  Viewer: "Read-only access to dashboards and rundowns.",
};

export type MemberStatus = "Active" | "Invited" | "Disabled";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  lastActive: string; // human string
}

export type AuthorityMode =
  | "LAN-only (cloud auth)"
  | "LAN-primary (cloud mirror)"
  | "Cloud-primary";

export type BridgeStatus = "Online" | "Degraded" | "Offline" | "Unpaired";

export interface EventRow {
  id: string;
  name: string;
  authority: AuthorityMode;
  bridge: BridgeStatus;
  lanInstances: number;
  lastActivity: string;
  outputsLocked: boolean;
}

export interface LanInstance {
  id: string;
  name: string;
  urls: string[];
  mdns?: string;
  version: string;
  bridge: BridgeStatus;
  lastHeartbeat: string;
  leaseExpires: string;
}

export interface BridgeDevice {
  id: string;
  name: string;
  team: string;
  eventScopes: string[];
  status: BridgeStatus;
  lastSeen: string;
  credential: "Healthy" | "Rotate soon" | "Revoked";
}

export type AuditType =
  | "login"
  | "team.role.changed"
  | "bridge.paired"
  | "bridge.credential.rotated"
  | "lease.renewed"
  | "remote.command.ack"
  | "remote.command.failed";

export interface AuditEntry {
  id: string;
  ts: string;
  type: AuditType;
  actor: string;
  event?: string;
  detail: string;
}

// ————————————————————————————————————————————————————————————
// Mock data
// ————————————————————————————————————————————————————————————

export const mockUser = {
  name: "Alex Vinter",
  email: "alex@northlight.gg",
  role: "Team Owner" as Role,
};

export const mockTeam = {
  id: "team_nl",
  name: "Northlight Broadcast",
  slug: "northlight",
  owner: "Alex Vinter",
  plan: "Pro (preview)",
  seats: 12,
  createdAt: "2025-11-04",
};

export const mockActiveEvent = {
  id: "evt_major_s1",
  name: "CS2 Major — Stage 1",
  authority: "LAN-primary (cloud mirror)" as AuthorityMode,
  bridge: "Online" as BridgeStatus,
};

export const mockMembers: Member[] = [
  { id: "m1", name: "Alex Vinter", email: "alex@northlight.gg", role: "Team Owner", status: "Active", lastActive: "just now" },
  { id: "m2", name: "Priya Shah", email: "priya@northlight.gg", role: "Producer", status: "Active", lastActive: "3m ago" },
  { id: "m3", name: "Marco Dell", email: "marco@northlight.gg", role: "Operator", status: "Active", lastActive: "18m ago" },
  { id: "m4", name: "June Okafor", email: "june@northlight.gg", role: "Operator", status: "Active", lastActive: "42m ago" },
  { id: "m5", name: "Kaz Tanaka", email: "kaz@northlight.gg", role: "Tournament Ops", status: "Active", lastActive: "2h ago" },
  { id: "m6", name: "Rin Alvaro", email: "rin@guest.gg", role: "Viewer", status: "Invited", lastActive: "—" },
  { id: "m7", name: "Sam Ortiz", email: "sam@northlight.gg", role: "Operator", status: "Disabled", lastActive: "6d ago" },
  { id: "m8", name: "CDEV Support", email: "cdev@control.dev", role: "CDEV", status: "Active", lastActive: "yesterday" },
];

export const mockEvents: EventRow[] = [
  { id: "evt_major_s1", name: "CS2 Major — Stage 1", authority: "LAN-primary (cloud mirror)", bridge: "Online", lanInstances: 3, lastActivity: "live now", outputsLocked: true },
  { id: "evt_qual_eu", name: "EU Qualifier — Week 4", authority: "LAN-only (cloud auth)", bridge: "Online", lanInstances: 1, lastActivity: "12m ago", outputsLocked: false },
  { id: "evt_studio", name: "Studio Rehearsal", authority: "Cloud-primary", bridge: "Degraded", lanInstances: 0, lastActivity: "1h ago", outputsLocked: false },
  { id: "evt_offseason", name: "Off-season Showmatch", authority: "LAN-only (cloud auth)", bridge: "Offline", lanInstances: 0, lastActivity: "3d ago", outputsLocked: false },
];

export const mockLanInstances: LanInstance[] = [
  {
    id: "lan1",
    name: "Gallery-A Rack",
    urls: ["http://10.20.4.11:7420", "http://control-a.lan:7420"],
    mdns: "control-a.local",
    version: "2.0.14",
    bridge: "Online",
    lastHeartbeat: "2s ago",
    leaseExpires: "in 28 days",
  },
  {
    id: "lan2",
    name: "Gallery-B Rack",
    urls: ["http://10.20.4.12:7420"],
    mdns: "control-b.local",
    version: "2.0.14",
    bridge: "Online",
    lastHeartbeat: "4s ago",
    leaseExpires: "in 28 days",
  },
  {
    id: "lan3",
    name: "Truck-3 Portable",
    urls: ["http://192.168.88.20:7420"],
    version: "2.0.12",
    bridge: "Degraded",
    lastHeartbeat: "1m ago",
    leaseExpires: "in 6 days",
  },
];

export const mockBridges: BridgeDevice[] = [
  { id: "brg1", name: "Gallery-A Bridge", team: "Northlight Broadcast", eventScopes: ["CS2 Major — Stage 1"], status: "Online", lastSeen: "2s ago", credential: "Healthy" },
  { id: "brg2", name: "Gallery-B Bridge", team: "Northlight Broadcast", eventScopes: ["CS2 Major — Stage 1", "EU Qualifier — Week 4"], status: "Online", lastSeen: "4s ago", credential: "Rotate soon" },
  { id: "brg3", name: "Truck-3 Bridge", team: "Northlight Broadcast", eventScopes: ["Studio Rehearsal"], status: "Degraded", lastSeen: "1m ago", credential: "Healthy" },
  { id: "brg4", name: "Legacy Truck-1", team: "Northlight Broadcast", eventScopes: [], status: "Offline", lastSeen: "9d ago", credential: "Revoked" },
];

export const mockLease = {
  validUntil: "2026-07-29",
  daysRemaining: 28,
  lastRenewal: "2026-06-30",
  state: "valid" as "valid" | "warning" | "expired",
};

export const mockAudit: AuditEntry[] = [
  { id: "a1", ts: "2026-07-01 14:22:08", type: "login", actor: "Alex Vinter", detail: "Signed in from 82.14.10.4 (Chrome / macOS)" },
  { id: "a2", ts: "2026-07-01 14:19:41", type: "remote.command.ack", actor: "Priya Shah", event: "CS2 Major — Stage 1", detail: "cue.fire MAP_WIN_A ack in 84ms" },
  { id: "a3", ts: "2026-07-01 13:58:02", type: "bridge.credential.rotated", actor: "Alex Vinter", detail: "Gallery-B Bridge credential rotated" },
  { id: "a4", ts: "2026-07-01 13:41:19", type: "team.role.changed", actor: "Alex Vinter", detail: "Marco Dell: Viewer → Operator" },
  { id: "a5", ts: "2026-07-01 12:10:00", type: "lease.renewed", actor: "system", detail: "LAN entitlement lease renewed for 30 days" },
  { id: "a6", ts: "2026-06-30 22:04:55", type: "remote.command.failed", actor: "June Okafor", event: "EU Qualifier — Week 4", detail: "output.freeze rejected: bridge degraded" },
  { id: "a7", ts: "2026-06-30 19:00:13", type: "bridge.paired", actor: "Alex Vinter", detail: "Truck-3 Bridge paired via code TX-4J9K" },
];
