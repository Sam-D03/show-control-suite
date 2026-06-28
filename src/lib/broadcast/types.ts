// Backend integration contract — all types the mock API and (future) real
// REST/WebSocket layer must satisfy. Pure data; no runtime imports.

export type ShowMode = "LIVE" | "REHEARSAL";
export type ConnectionStatus = "ONLINE" | "OFFLINE" | "DEGRADED";
export type MatchPhase =
  | "PRE_GAME"
  | "LIVE"
  | "TECH_PAUSE"
  | "TACTICAL_TIMEOUT"
  | "POST_MAP"
  | "BREAK";

export type Side = "CT" | "T";

export type EventFamilyId =
  | "MAP_WIN"
  | "MATCH_WIN"
  | "TIMEOUT"
  | "AUTOMATION"
  | "TIMER_COMPLETE"
  | "EMERGENCY";

export type DepartmentId =
  | "LIGHTING"
  | "LED"
  | "AUDIO"
  | "GRAPHICS"
  | "REPLAY"
  | "TIMING"
  | "COMPANION";

export type TriggerSection =
  | "MATCH_FLOW"
  | "COMPETITIVE"
  | "TIMEOUTS"
  | "BROADCAST_FLOW"
  | "STAGE";

export type OutputId =
  | "LIGHTING_OSC"
  | "LED_MEDIA"
  | "AUDIO_COMPANION"
  | "GRAPHICS_WS"
  | "REPLAY_EVS"
  | "TIMING_LAN"
  | "CLOUD_MIRROR";

export interface Player {
  id: string;
  handle: string;
  role: string; // IGL, AWP, Lurker, Rifler, Support
}

export interface Team {
  id: string;
  name: string;
  short: string; // 3-letter code
  color: string; // hex/oklch swatch
  players: Player[];
}

export interface SeatAssignment {
  teamId: string;
  seatIndex: number; // 0..4
  playerId: string;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  currentMap: string; // e.g. "Mirage"
  mapNumber: number; // 1..N in BO5
  bestOf: number;
  seriesScore: { a: number; b: number };
  mapScore: { a: number; b: number };
  sides: { a: Side; b: Side };
  phase: MatchPhase;
  seating: SeatAssignment[];
}

export interface TimerState {
  id: string;
  label: string;
  remainingMs: number;
  totalMs: number;
  running: boolean;
  targetTod?: string; // HH:MM:SS local time-of-day
  linkedTriggerId?: string;
}

export interface EventFamilyArm {
  family: EventFamilyId;
  armed: boolean;
  expiresAt?: number; // epoch ms
  armedBy?: string;
}

export interface TriggerDefinition {
  id: string;
  name: string;
  section: TriggerSection;
  family: EventFamilyId;
  protected: boolean; // requires hold-to-fire AND armed family
  departments: DepartmentId[];
  lastFiredAt?: number;
}

export interface OutputRouteStatus {
  id: OutputId;
  label: string;
  transport: string; // "OSC" | "WebSocket" | "HTTP" | "MIDI" ...
  status: ConnectionStatus;
  latencyMs?: number;
  readOnly?: boolean;
  note?: string;
}

export interface AutomationSignal {
  id: string;
  title: string;
  source: "CS2_GSI" | "TIMER" | "OBSERVER" | "STATS";
  confidence: number; // 0..1
  receivedAt: number;
  requiredArm: EventFamilyId;
  suggestedTriggerId?: string;
  status: "PENDING" | "APPROVED" | "DISMISSED";
}

export type LogSeverity = "INFO" | "WARN" | "ERROR" | "OK";

export interface EventLogEntry {
  id: string;
  at: number;
  kind:
    | "CUE_FIRED"
    | "ARMED"
    | "DISARMED"
    | "AUTOMATION_RECEIVED"
    | "AUTOMATION_APPROVED"
    | "AUTOMATION_DISMISSED"
    | "STATE_CHANGED"
    | "TIMER_CONTROLLED"
    | "OUTPUT_FAIL"
    | "SAFETY";
  message: string;
  source: string; // operator name or "SYSTEM"
  severity: LogSeverity;
}

export interface ShowState {
  eventName: string;
  showDay: string; // e.g. "Day 3 — Playoffs"
  mode: ShowMode;
  operator: string;
  lanStatus: ConnectionStatus;
  cloudMirrorStatus: ConnectionStatus;
  disableAutomations: boolean;
  freezeOutputs: boolean;
  match: Match;
  arms: EventFamilyArm[];
  triggers: TriggerDefinition[];
  timers: TimerState[];
  outputs: OutputRouteStatus[];
  automation: AutomationSignal[];
  log: EventLogEntry[];
}

// Future WebSocket envelope shape (kept for documentation parity).
export type ShowWsEvent =
  | { type: "show.state.changed"; state: ShowState }
  | { type: "cue.fired"; triggerId: string; at: number }
  | { type: "timer.event"; timerId: string; remainingMs: number; completed: boolean }
  | { type: "automation.signal.received"; signal: AutomationSignal }
  | { type: "output.status.changed"; outputId: OutputId; status: ConnectionStatus };
