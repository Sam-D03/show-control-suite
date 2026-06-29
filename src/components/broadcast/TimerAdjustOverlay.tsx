/**
 * TimerAdjustOverlay
 * Design-only component. Rendered inside a TimerBlock (relative parent) when
 * the broadcast operator nudges a timer's remaining time. Sits above the
 * digits — never on top of them — so the main timer stays fully legible.
 */

type Size = "xl" | "lg" | "md" | "sm";

const TEXT_SIZE: Record<Size, string> = {
  xl: "text-[3.6vw] xl:text-[3rem]",
  lg: "text-[2.6vw] xl:text-[2.2rem]",
  md: "text-[2vw] xl:text-[1.6rem]",
  sm: "text-[1.4vw] xl:text-[1.15rem]",
};

const PAD: Record<Size, string> = {
  xl: "px-6 py-2.5",
  lg: "px-5 py-2",
  md: "px-4 py-1.5",
  sm: "px-3 py-1",
};

// Vertical offset (from top of timer block) the chip animates around.
// Keeps the chip clear of the label row at top AND of the digits in the centre.
const TOP_OFFSET: Record<Size, string> = {
  xl: "top-[16%]",
  lg: "top-[18%]",
  md: "top-[20%]",
  sm: "top-[22%]",
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

  const tone = positive
    ? {
        text: "text-accent",
        border: "border-accent/70",
        bg: "bg-[color-mix(in_oklab,var(--accent)_18%,var(--panel)_82%)]",
        glow: "shadow-[0_8px_28px_color-mix(in_oklab,var(--accent)_45%,transparent),inset_0_0_18px_color-mix(in_oklab,var(--accent)_22%,transparent)]",
        label: "ADDED",
      }
    : {
        text: "text-status-warn",
        border: "border-status-warn/70",
        bg: "bg-[color-mix(in_oklab,var(--status-warn)_18%,var(--panel)_82%)]",
        glow: "shadow-[0_8px_28px_color-mix(in_oklab,var(--status-warn)_45%,transparent),inset_0_0_18px_color-mix(in_oklab,var(--status-warn)_22%,transparent)]",
        label: "REMOVED",
      };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Expanding ring — anchored to the chip position, draws the eye */}
      <div
        className={`absolute left-1/2 ${TOP_OFFSET[size]} h-24 w-24 xl:h-32 xl:w-32 rounded-full border-2 ${tone.border} opacity-0 adjust-ring`}
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div
        className={`absolute left-1/2 ${TOP_OFFSET[size]} h-24 w-24 xl:h-32 xl:w-32 rounded-full border ${tone.border} opacity-0 adjust-ring-delayed`}
        style={{ transform: "translate(-50%, -50%)" }}
      />

      {/* Delta chip */}
      <div
        className={`absolute left-1/2 ${TOP_OFFSET[size]} adjust-overlay-enter ${PAD[size]} rounded-sm border ${tone.border} ${tone.bg} ${tone.glow} flex items-center gap-3`}
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
          style={{ letterSpacing: "-0.02em", textShadow: "0 0 14px currentColor" }}
        >
          {formatDelta(deltaMs)}
        </div>
      </div>
    </div>
  );
}

