import type { Match, MatchPhase, Side } from "@/lib/broadcast/types";

const phaseLabel: Record<MatchPhase, string> = {
  PRE_GAME: "Pre-Game",
  LIVE: "Live",
  TECH_PAUSE: "Tech Pause",
  TACTICAL_TIMEOUT: "Tactical Timeout",
  POST_MAP: "Post-Map",
  BREAK: "Break",
};

const phaseTone: Record<MatchPhase, string> = {
  PRE_GAME: "bg-status-info/15 text-status-info border-status-info/40",
  LIVE: "bg-status-live/15 text-status-live border-status-live/40",
  TECH_PAUSE: "bg-status-warn/15 text-status-warn border-status-warn/40",
  TACTICAL_TIMEOUT: "bg-status-warn/15 text-status-warn border-status-warn/40",
  POST_MAP: "bg-status-ok/15 text-status-ok border-status-ok/40",
  BREAK: "bg-status-rehearsal/15 text-status-rehearsal border-status-rehearsal/40",
};

function SideTag({ side }: { side: Side }) {
  const color = side === "CT" ? "text-side-ct border-side-ct/50 bg-side-ct/10" : "text-side-t border-side-t/50 bg-side-t/10";
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider border rounded-sm ${color}`}>
      {side}
    </span>
  );
}

function TeamBlock({
  team,
  side,
  seriesScore,
  mapScore,
  align,
}: {
  team: Match["teamA"];
  side: Side;
  seriesScore: number;
  mapScore: number;
  align: "left" | "right";
}) {
  const isRight = align === "right";
  return (
    <div className={`flex-1 flex ${isRight ? "flex-row-reverse" : ""} gap-3 min-w-0`}>
      {/* logo placeholder */}
      <div
        className="h-12 w-12 shrink-0 rounded-sm border border-panel-edge flex items-center justify-center font-bold text-[14px] tracking-wider"
        style={{ backgroundColor: `color-mix(in oklab, ${team.color} 18%, transparent)`, color: team.color }}
      >
        {team.short}
      </div>
      <div className={`flex-1 min-w-0 flex flex-col justify-center ${isRight ? "items-end text-right" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold truncate">{team.name}</span>
          <SideTag side={side} />
        </div>
        <div className={`mt-1 flex items-center gap-1.5 ${isRight ? "flex-row-reverse" : ""}`}>
          {team.players.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-panel-elev border border-panel-edge"
            >
              <span className="text-[9px] text-muted-foreground tabular">{i + 1}</span>
              <span className="text-[11px] text-foreground/90 truncate max-w-[80px]">{p.handle}</span>
              <span className="text-[9px] text-muted-foreground">{p.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`flex flex-col items-center justify-center px-3 border-l border-r border-panel-edge bg-panel-elev rounded-sm`}>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Series</div>
        <div className="text-[22px] font-bold tabular leading-none mt-0.5">{seriesScore}</div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Map</div>
        <div className="text-[16px] font-semibold tabular leading-none mt-0.5">{mapScore}</div>
      </div>
    </div>
  );
}

export function CurrentMatchPanel({ match }: { match: Match }) {
  return (
    <section className="bg-panel border-b border-panel-edge px-3 py-2 flex items-stretch gap-3 h-[120px]">
      <TeamBlock
        team={match.teamA}
        side={match.sides.a}
        seriesScore={match.seriesScore.a}
        mapScore={match.mapScore.a}
        align="left"
      />

      <div className="flex flex-col items-center justify-center px-4 border-l border-r border-panel-edge min-w-[170px]">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current Map</div>
        <div className="text-[18px] font-bold leading-tight mt-0.5">{match.currentMap}</div>
        <div className="text-[10px] text-muted-foreground tabular mt-0.5">
          Map {match.mapNumber} of {match.bestOf}
        </div>
        <div className={`mt-2 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase border rounded-sm ${phaseTone[match.phase]}`}>
          {phaseLabel[match.phase]}
        </div>
      </div>

      <TeamBlock
        team={match.teamB}
        side={match.sides.b}
        seriesScore={match.seriesScore.b}
        mapScore={match.mapScore.b}
        align="right"
      />
    </section>
  );
}
