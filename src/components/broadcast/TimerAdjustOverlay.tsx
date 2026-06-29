/**
 * TimerAdjustOverlay
 * Design-only component. Rendered inside a TimerBlock (relative parent) when
 * the broadcast operator nudges a timer's remaining time. The actual trigger
 * wiring is handled elsewhere; this component is the visual treatment.
 *
 * Usage:
 *   <div className="relative ...">
 *     ...timer digits...
 *     {adjustment && (
 *       <TimerAdjustOverlay
 *         key={adjustment.id}          // remount per event to restart anim
 *         deltaMs={adjustment.deltaMs} // signed: +/-
 *         size="lg"
 *       />
 *     )}
 *   </div>
 */

type Size = "xl" | "lg" | "md" | "sm";

const TEXT_SIZE: Record<Size, string> = {
  xl: "text-[6vw] xl:text-[5rem]",
  lg: "text-[4.2vw] xl:text-[3.5rem]",
  md: "text-[3vw] xl:text-[2.4rem]",
  sm: "text-[2vw] xl:text-[1.6rem]",
};

const PAD: Record<Size, string> = {
  xl: "px-8 py-3",
  lg: "px-6 py-2.5",
  md: "px-5 py-2",
  sm: "px-3 py-1.5",
};

function formatDelta(deltaMs: number): string {
  const sign = deltaMs >= 0 ? "+" : "−";
  const abs = Math.abs(deltaMs);
  const totalSec = Math.round(abs / 1000);
  if (totalSec >= 60 && totalSec % 60 === 0) return `${sign}${totalSec / 60}m`;
  if (totalSec >= 60) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${sign}${m}m ${s}s`;
  }
  return `${sign}${totalSec}s`;
}

export interface TimerAdjustOverlayProps {
  deltaMs: number;
  size?: Size;
}

export function TimerAdjustOverlay({ deltaMs, size = "lg" }: TimerAdjustOverlayProps) {
  const positive = deltaMs >= 0;

  // Semantic colors from the existing kiosk palette
  const tone = positive
    ? {
        text: "text-accent",
        border: "border-accent/60",
        bg: "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]",
        glow: "shadow-[0_0_36px_color-mix(in_oklab,var(--accent)_45%,transparent),inset_0_0_24px_color-mix(in_oklab,var(--accent)_18%,transparent)]",
        ring: "border-accent",
        label: "ADDED",
      }
    : {
        text: "text-status-warn",
        border: "border-status-warn/60",
        bg: "bg-[color-mix(in_oklab,var(--status-warn)_14%,transparent)]",
        glow: "shadow-[0_0_36px_color-mix(in_oklab,var(--status-warn)_45%,transparent),inset_0_0_24px_color-mix(in_oklab,var(--status-warn)_18%,transparent)]",
        ring: "border-status-warn",
        label: "REMOVED",
      };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Expanding accent ring — visually anchors the pop to the timer block */}
      <div
        className={`absolute left-1/2 top-1/2 h-[58%] aspect-square rounded-full border-2 ${tone.ring} opacity-0 adjust-ring`}
        style={{ transform: "translate(-50%, -50%)" }}
      />

      {/* Primary delta chip */}
      <div
        className={`absolute left-1/2 top-1/2 adjust-overlay-enter ${PAD[size]} rounded-sm border ${tone.border} ${tone.bg} ${tone.glow} backdrop-blur-[2px] flex items-center gap-3`}
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div
          className={`flex flex-col leading-none uppercase tracking-[0.22em] font-semibold text-[10px] xl:text-xs ${tone.text} opacity-80`}
        >
          <span>Time</span>
          <span>{tone.label}</span>
        </div>
        <div
          className={`font-mono tabular font-bold leading-none ${TEXT_SIZE[size]} ${tone.text}`}
          style={{ letterSpacing: "-0.02em", textShadow: "0 0 18px currentColor" }}
        >
          {formatDelta(deltaMs)}
        </div>
      </div>
    </div>
  );
}
