// In-memory mock service layer with a tiny pub/sub. Designed so each public
// function maps 1:1 to a future REST endpoint, and the subscribe channel maps
// to a future WebSocket connection. Components consume via useShowState().

import { useSyncExternalStore } from "react";
import { initialShowState } from "./mockData";
import type {
  AutomationSignal,
  EventFamilyId,
  EventLogEntry,
  ShowState,
} from "./types";

type Listener = () => void;

let state: ShowState = structuredClone(initialShowState);
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(updater: (s: ShowState) => ShowState) {
  state = updater(state);
  emit();
}

function pushLog(entry: Omit<EventLogEntry, "id" | "at"> & { at?: number }) {
  const log: EventLogEntry = {
    id: `l-${Math.random().toString(36).slice(2, 9)}`,
    at: entry.at ?? Date.now(),
    kind: entry.kind,
    message: entry.message,
    source: entry.source,
    severity: entry.severity,
  };
  setState((s) => ({ ...s, log: [log, ...s.log].slice(0, 200) }));
}

// ── Future REST surface ────────────────────────────────────────────────────
export const broadcastApi = {
  getCurrentShowState(): ShowState {
    return state;
  },

  armEventFamily(family: EventFamilyId, durationMs = 600_000) {
    setState((s) => ({
      ...s,
      arms: s.arms.map((a) =>
        a.family === family
          ? { ...a, armed: true, expiresAt: Date.now() + durationMs, armedBy: s.operator }
          : a,
      ),
    }));
    pushLog({ kind: "ARMED", message: `${family} armed`, source: state.operator, severity: "INFO" });
  },

  disarmEventFamily(family: EventFamilyId) {
    setState((s) => ({
      ...s,
      arms: s.arms.map((a) =>
        a.family === family ? { ...a, armed: false, expiresAt: undefined } : a,
      ),
    }));
    pushLog({ kind: "DISARMED", message: `${family} disarmed`, source: state.operator, severity: "INFO" });
  },

  fireTrigger(triggerId: string): { ok: boolean; reason?: string } {
    const trig = state.triggers.find((t) => t.id === triggerId);
    if (!trig) return { ok: false, reason: "Unknown trigger" };
    const arm = state.arms.find((a) => a.family === trig.family);
    if (trig.protected && !arm?.armed) {
      pushLog({
        kind: "SAFETY",
        message: `Blocked '${trig.name}' — ${trig.family} not armed`,
        source: state.operator,
        severity: "WARN",
      });
      return { ok: false, reason: "Family not armed" };
    }
    if (state.freezeOutputs) {
      pushLog({
        kind: "SAFETY",
        message: `Outputs frozen — '${trig.name}' simulated only`,
        source: state.operator,
        severity: "WARN",
      });
    }
    setState((s) => ({
      ...s,
      triggers: s.triggers.map((t) =>
        t.id === triggerId ? { ...t, lastFiredAt: Date.now() } : t,
      ),
    }));
    pushLog({
      kind: "CUE_FIRED",
      message: `${trig.name} → ${trig.departments.join(", ")}`,
      source: state.operator,
      severity: "OK",
    });
    return { ok: true };
  },

  approveAutomation(signalId: string) {
    const sig = state.automation.find((a) => a.id === signalId);
    if (!sig) return;
    setState((s) => ({
      ...s,
      automation: s.automation.map((a) =>
        a.id === signalId ? { ...a, status: "APPROVED" } : a,
      ),
    }));
    pushLog({
      kind: "AUTOMATION_APPROVED",
      message: `Approved: ${sig.title}`,
      source: state.operator,
      severity: "OK",
    });
    if (sig.suggestedTriggerId) broadcastApi.fireTrigger(sig.suggestedTriggerId);
  },

  dismissAutomation(signalId: string) {
    const sig = state.automation.find((a) => a.id === signalId);
    if (!sig) return;
    setState((s) => ({
      ...s,
      automation: s.automation.map((a) =>
        a.id === signalId ? { ...a, status: "DISMISSED" } : a,
      ),
    }));
    pushLog({
      kind: "AUTOMATION_DISMISSED",
      message: `Dismissed: ${sig.title}`,
      source: state.operator,
      severity: "INFO",
    });
  },

  freezeExternalOutputs(enabled: boolean) {
    setState((s) => ({ ...s, freezeOutputs: enabled }));
    pushLog({
      kind: "SAFETY",
      message: `External outputs ${enabled ? "FROZEN" : "live"}`,
      source: state.operator,
      severity: enabled ? "WARN" : "OK",
    });
  },

  disableAutomations(enabled: boolean) {
    setState((s) => ({ ...s, disableAutomations: enabled }));
    pushLog({
      kind: "SAFETY",
      message: `Automations ${enabled ? "DISABLED" : "enabled"}`,
      source: state.operator,
      severity: enabled ? "WARN" : "OK",
    });
  },

  playPauseTimer(timerId: string) {
    const t = state.timers.find((tm) => tm.id === timerId);
    if (!t) return;
    const running = !t.running;
    setState((s) => ({
      ...s,
      timers: s.timers.map((tm) => (tm.id === timerId ? { ...tm, running } : tm)),
    }));
    pushLog({
      kind: "TIMER_CONTROLLED",
      message: `${t.label} ${running ? "started" : "paused"}`,
      source: state.operator,
      severity: "INFO",
    });
  },

  resetTimer(timerId: string) {
    const t = state.timers.find((tm) => tm.id === timerId);
    if (!t) return;
    setState((s) => ({
      ...s,
      timers: s.timers.map((tm) =>
        tm.id === timerId ? { ...tm, remainingMs: 0, running: false } : tm,
      ),
    }));
    pushLog({
      kind: "TIMER_CONTROLLED",
      message: `${t.label} reset to 00:00`,
      source: state.operator,
      severity: "INFO",
    });
  },

  adjustTimer(timerId: string, deltaMs: number) {
    const t = state.timers.find((tm) => tm.id === timerId);
    if (!t) return;
    const remainingMs = Math.max(0, Math.min(t.totalMs, t.remainingMs + deltaMs));
    setState((s) => ({
      ...s,
      timers: s.timers.map((tm) =>
        tm.id === timerId ? { ...tm, remainingMs } : tm,
      ),
    }));
    const sign = deltaMs >= 0 ? "+" : "";
    const secs = Math.round(deltaMs / 1000);
    pushLog({
      kind: "TIMER_CONTROLLED",
      message: `${t.label} ${sign}${secs}s`,
      source: state.operator,
      severity: "INFO",
    });
  },

  injectAutomationSignal(signal: AutomationSignal) {
    setState((s) => ({ ...s, automation: [signal, ...s.automation] }));
    pushLog({
      kind: "AUTOMATION_RECEIVED",
      message: signal.title,
      source: "SYSTEM",
      severity: "INFO",
    });
  },

  // ── Future WebSocket surface (mock) ──
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// Tick: countdowns for arms + timers
let ticker: ReturnType<typeof setInterval> | null = null;
function ensureTicker() {
  if (ticker || typeof window === "undefined") return;
  ticker = setInterval(() => {
    const now = Date.now();
    let changed = false;
    const arms = state.arms.map((a) => {
      if (a.armed && a.expiresAt && a.expiresAt <= now) {
        changed = true;
        return { ...a, armed: false, expiresAt: undefined };
      }
      return a;
    });
    const timers = state.timers.map((t) => {
      if (!t.running) return t;
      const remaining = Math.max(0, t.remainingMs - 1000);
      if (remaining !== t.remainingMs) changed = true;
      return { ...t, remainingMs: remaining, running: remaining > 0 };
    });
    if (changed) setState((s) => ({ ...s, arms, timers }));
  }, 1000);
}

// React hook
export function useShowState(): ShowState {
  ensureTicker();
  return useSyncExternalStore(
    (cb) => broadcastApi.subscribe(cb),
    () => state,
    () => state,
  );
}
