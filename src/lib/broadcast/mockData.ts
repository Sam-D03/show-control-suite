import type {
  AutomationSignal,
  EventFamilyArm,
  EventLogEntry,
  Match,
  OutputRouteStatus,
  ShowState,
  TimerState,
  TriggerDefinition,
} from "./types";

const now = () => Date.now();

const teamA = {
  id: "team-navi",
  name: "Natus Vincere",
  short: "NAV",
  color: "#f7d046",
  players: [
    { id: "p-a1", handle: "s1mple", role: "AWP" },
    { id: "p-a2", handle: "electroNic", role: "Rifler" },
    { id: "p-a3", handle: "Aleksib", role: "IGL" },
    { id: "p-a4", handle: "iM", role: "Lurker" },
    { id: "p-a5", handle: "jL", role: "Support" },
  ],
};

const teamB = {
  id: "team-faze",
  name: "FaZe Clan",
  short: "FAZ",
  color: "#e8413b",
  players: [
    { id: "p-b1", handle: "karrigan", role: "IGL" },
    { id: "p-b2", handle: "rain", role: "Entry" },
    { id: "p-b3", handle: "frozen", role: "Rifler" },
    { id: "p-b4", handle: "broky", role: "AWP" },
    { id: "p-b5", handle: "ropz", role: "Lurker" },
  ],
};

const match: Match = {
  id: "match-gf-01",
  teamA,
  teamB,
  currentMap: "Mirage",
  mapNumber: 3,
  bestOf: 5,
  seriesScore: { a: 1, b: 1 },
  mapScore: { a: 12, b: 9 },
  sides: { a: "CT", b: "T" },
  phase: "LIVE",
  seating: [
    ...teamA.players.map((p, i) => ({ teamId: teamA.id, seatIndex: i, playerId: p.id })),
    ...teamB.players.map((p, i) => ({ teamId: teamB.id, seatIndex: i, playerId: p.id })),
  ],
};

const arms: EventFamilyArm[] = [
  { family: "MAP_WIN", armed: false },
  { family: "MATCH_WIN", armed: false },
  { family: "TIMEOUT", armed: true, expiresAt: now() + 90_000, armedBy: "AD-1" },
  { family: "AUTOMATION", armed: true, expiresAt: now() + 600_000, armedBy: "AD-1" },
  { family: "TIMER_COMPLETE", armed: true, expiresAt: now() + 600_000, armedBy: "AD-1" },
  { family: "EMERGENCY", armed: false },
];

const triggers: TriggerDefinition[] = [
  // MATCH FLOW
  { id: "t-walkout", name: "Walkout", section: "MATCH_FLOW", family: "AUTOMATION", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS"] },
  { id: "t-knife", name: "Knife Round", section: "MATCH_FLOW", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "AUDIO"] },
  { id: "t-mapstart", name: "Map Start", section: "MATCH_FLOW", family: "AUTOMATION", protected: true,
    departments: ["LIGHTING", "LED", "GRAPHICS", "TIMING", "COMPANION"] },
  { id: "t-mappause", name: "Map Pause", section: "MATCH_FLOW", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "TIMING"] },
  { id: "t-resume", name: "Resume", section: "MATCH_FLOW", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "TIMING", "AUDIO"] },
  { id: "t-mapend", name: "Map End", section: "MATCH_FLOW", family: "MAP_WIN", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS", "REPLAY", "TIMING"] },
  { id: "t-matchend", name: "Match End", section: "MATCH_FLOW", family: "MATCH_WIN", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS", "REPLAY", "TIMING", "COMPANION"] },

  // COMPETITIVE
  { id: "t-a-mapwin", name: "NAV Map Win", section: "COMPETITIVE", family: "MAP_WIN", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS"], lastFiredAt: now() - 3_600_000 },
  { id: "t-b-mapwin", name: "FAZ Map Win", section: "COMPETITIVE", family: "MAP_WIN", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS"] },
  { id: "t-a-matchwin", name: "NAV Match Win", section: "COMPETITIVE", family: "MATCH_WIN", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS", "COMPANION"] },
  { id: "t-b-matchwin", name: "FAZ Match Win", section: "COMPETITIVE", family: "MATCH_WIN", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS", "COMPANION"] },
  { id: "t-matchpoint", name: "Match Point", section: "COMPETITIVE", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "AUDIO"] },
  { id: "t-overtime", name: "Overtime", section: "COMPETITIVE", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "AUDIO", "LED"] },

  // TIMEOUTS
  { id: "t-a-tac", name: "NAV Tac Timeout", section: "TIMEOUTS", family: "TIMEOUT", protected: false,
    departments: ["GRAPHICS", "TIMING", "AUDIO"] },
  { id: "t-b-tac", name: "FAZ Tac Timeout", section: "TIMEOUTS", family: "TIMEOUT", protected: false,
    departments: ["GRAPHICS", "TIMING", "AUDIO"] },
  { id: "t-tech", name: "Tech Pause", section: "TIMEOUTS", family: "TIMEOUT", protected: true,
    departments: ["GRAPHICS", "TIMING", "AUDIO", "LED"] },
  { id: "t-admin", name: "Admin Pause", section: "TIMEOUTS", family: "EMERGENCY", protected: true,
    departments: ["GRAPHICS", "TIMING", "AUDIO", "LED", "LIGHTING"] },

  // BROADCAST FLOW
  { id: "t-desk", name: "Desk Throw", section: "BROADCAST_FLOW", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "AUDIO"] },
  { id: "t-caster", name: "Caster Throw", section: "BROADCAST_FLOW", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "AUDIO"] },
  { id: "t-replay", name: "Replay Package", section: "BROADCAST_FLOW", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "AUDIO", "REPLAY"] },
  { id: "t-commercial", name: "Commercial Break", section: "BROADCAST_FLOW", family: "AUTOMATION", protected: true,
    departments: ["GRAPHICS", "AUDIO", "TIMING", "LED"] },
  { id: "t-return", name: "Return From Break", section: "BROADCAST_FLOW", family: "TIMER_COMPLETE", protected: true,
    departments: ["GRAPHICS", "AUDIO", "TIMING", "LED", "LIGHTING"] },

  // STAGE
  { id: "t-entrance", name: "Player Entrance", section: "STAGE", family: "AUTOMATION", protected: false,
    departments: ["LIGHTING", "LED", "AUDIO"] },
  { id: "t-trophyready", name: "Trophy Ready", section: "STAGE", family: "MATCH_WIN", protected: true,
    departments: ["LIGHTING", "LED", "COMPANION"] },
  { id: "t-trophylift", name: "Trophy Lift", section: "STAGE", family: "MATCH_WIN", protected: true,
    departments: ["LIGHTING", "LED", "AUDIO", "GRAPHICS"] },
  { id: "t-crowd", name: "Crowd Shot", section: "STAGE", family: "AUTOMATION", protected: false,
    departments: ["GRAPHICS", "AUDIO"] },
  { id: "t-lightsreset", name: "Lights Reset", section: "STAGE", family: "AUTOMATION", protected: false,
    departments: ["LIGHTING"] },
];

const timers: TimerState[] = [
  { id: "tm-break", label: "Break Countdown", remainingMs: 184_000, totalMs: 300_000, running: true,
    targetTod: "20:42:00", linkedTriggerId: "t-return" },
  { id: "tm-tac", label: "Tactical Timeout", remainingMs: 27_000, totalMs: 30_000, running: true },
  { id: "tm-segment", label: "Next Segment TOD", remainingMs: 940_000, totalMs: 1_200_000, running: true,
    targetTod: "20:55:00" },
];

const outputs: OutputRouteStatus[] = [
  { id: "LIGHTING_OSC", label: "Lighting — grandMA", transport: "OSC/MIDI", status: "ONLINE", latencyMs: 4 },
  { id: "LED_MEDIA", label: "LED / Media Server", transport: "OSC", status: "ONLINE", latencyMs: 6 },
  { id: "AUDIO_COMPANION", label: "Audio Playback", transport: "Companion/HTTP", status: "DEGRADED", latencyMs: 38,
    note: "High RTT on subnet" },
  { id: "GRAPHICS_WS", label: "Broadcast Graphics", transport: "WebSocket", status: "ONLINE", latencyMs: 9 },
  { id: "REPLAY_EVS", label: "Replay / EVS Labels", transport: "State Output", status: "ONLINE", latencyMs: 12 },
  { id: "TIMING_LAN", label: "Timing Screens", transport: "LAN WebSocket", status: "ONLINE", latencyMs: 3 },
  { id: "CLOUD_MIRROR", label: "Cloud Viewer Mirror", transport: "HTTPS", status: "ONLINE", readOnly: true, latencyMs: 142 },
];

const automation: AutomationSignal[] = [
  { id: "as-1", title: "Possible NAV map win detected (15–9 CT)", source: "CS2_GSI", confidence: 0.92,
    receivedAt: now() - 8_000, requiredArm: "MAP_WIN", suggestedTriggerId: "t-a-mapwin", status: "PENDING" },
  { id: "as-2", title: "Timer 'Return From Break' reached 00:03", source: "TIMER", confidence: 1,
    receivedAt: now() - 3_000, requiredArm: "TIMER_COMPLETE", suggestedTriggerId: "t-return", status: "PENDING" },
  { id: "as-3", title: "FAZ tactical timeout called in-game", source: "CS2_GSI", confidence: 0.99,
    receivedAt: now() - 22_000, requiredArm: "TIMEOUT", suggestedTriggerId: "t-b-tac", status: "PENDING" },
  { id: "as-4", title: "Observer marked highlight (clutch attempt)", source: "OBSERVER", confidence: 0.66,
    receivedAt: now() - 41_000, requiredArm: "AUTOMATION", status: "PENDING" },
];

const log: EventLogEntry[] = [
  { id: "l-1", at: now() - 240_000, kind: "CUE_FIRED", message: "Map Start fired", source: "AD-1", severity: "OK" },
  { id: "l-2", at: now() - 230_000, kind: "ARMED", message: "AUTOMATION armed (10:00)", source: "AD-1", severity: "INFO" },
  { id: "l-3", at: now() - 180_000, kind: "AUTOMATION_RECEIVED", message: "GSI: round_phase=live", source: "SYSTEM", severity: "INFO" },
  { id: "l-4", at: now() - 95_000, kind: "OUTPUT_FAIL", message: "Audio Companion latency 38ms", source: "SYSTEM", severity: "WARN" },
  { id: "l-5", at: now() - 60_000, kind: "CUE_FIRED", message: "Caster Throw fired", source: "AD-1", severity: "OK" },
  { id: "l-6", at: now() - 22_000, kind: "AUTOMATION_RECEIVED", message: "FAZ tactical timeout", source: "SYSTEM", severity: "INFO" },
];

export const initialShowState: ShowState = {
  eventName: "IEM Katowice 2026 — Grand Final",
  showDay: "Day 9 — Playoffs",
  mode: "LIVE",
  operator: "K. Marlow (AD-1)",
  lanStatus: "ONLINE",
  cloudMirrorStatus: "ONLINE",
  disableAutomations: false,
  freezeOutputs: false,
  match,
  arms,
  triggers,
  timers,
  outputs,
  automation,
  log,
};
