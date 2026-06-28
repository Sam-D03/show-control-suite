import type { OutputRouteStatus } from "@/lib/broadcast/types";

function tone(status: OutputRouteStatus["status"]) {
  switch (status) {
    case "ONLINE":
      return "text-status-ok border-status-ok/50 bg-status-ok/10";
    case "DEGRADED":
      return "text-status-warn border-status-warn/50 bg-status-warn/10";
    case "OFFLINE":
      return "text-status-error border-status-error/50 bg-status-error/10";
  }
}

function dotColor(status: OutputRouteStatus["status"]) {
  return status === "ONLINE"
    ? "bg-status-ok"
    : status === "DEGRADED"
      ? "bg-status-warn"
      : "bg-status-error";
}

export function OutputHealthPanel({
  outputs,
  frozen,
}: {
  outputs: OutputRouteStatus[];
  frozen: boolean;
}) {
  return (
    <section className="bg-panel border border-panel-edge rounded-sm flex flex-col min-h-0">
      <header className="flex items-center justify-between px-3 h-9 border-b border-panel-edge shrink-0">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Output Health
        </span>
        {frozen && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-status-warn/15 text-status-warn uppercase tracking-wider">
            Outputs Frozen
          </span>
        )}
      </header>
      <div className="flex-1 overflow-auto p-2 grid grid-cols-1 gap-1.5">
        {outputs.map((o) => (
          <div
            key={o.id}
            className="px-2.5 py-1.5 bg-panel-elev rounded-sm border border-panel-edge flex items-center gap-2"
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor(o.status)}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold truncate">{o.label}</span>
                {o.readOnly && (
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground border border-panel-edge px-1 rounded-sm">
                    RO
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground tabular truncate">
                {o.transport}
                {o.latencyMs != null ? ` · ${o.latencyMs}ms` : ""}
                {o.note ? ` · ${o.note}` : ""}
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${tone(o.status)}`}
            >
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
