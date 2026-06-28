import type { EventLogEntry, LogSeverity } from "@/lib/broadcast/types";

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-GB");
}

function sevColor(s: LogSeverity) {
  switch (s) {
    case "OK":
      return "text-status-ok";
    case "WARN":
      return "text-status-warn";
    case "ERROR":
      return "text-status-error";
    default:
      return "text-status-info";
  }
}

function sevTag(s: LogSeverity) {
  return s === "OK" ? "OK " : s === "WARN" ? "WRN" : s === "ERROR" ? "ERR" : "INF";
}

export function EventLog({ entries }: { entries: EventLogEntry[] }) {
  return (
    <section className="bg-panel border border-panel-edge rounded-sm flex flex-col min-h-0">
      <header className="flex items-center justify-between px-3 h-9 border-b border-panel-edge shrink-0">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Event Log
        </span>
        <span className="text-[10px] text-muted-foreground tabular">{entries.length} entries</span>
      </header>
      <div className="flex-1 overflow-auto font-mono text-[11.5px]">
        <table className="w-full">
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-panel-edge/60 hover:bg-panel-elev/60 align-top"
              >
                <td className="px-2 py-1 text-muted-foreground tabular w-[78px] whitespace-nowrap">
                  {fmtTime(e.at)}
                </td>
                <td className={`px-1 py-1 font-bold w-[34px] ${sevColor(e.severity)}`}>
                  {sevTag(e.severity)}
                </td>
                <td className="px-1 py-1 text-muted-foreground w-[110px] truncate uppercase tracking-wider text-[10px]">
                  {e.kind.replace("_", " ").toLowerCase()}
                </td>
                <td className="px-1 py-1 text-foreground">{e.message}</td>
                <td className="px-2 py-1 text-muted-foreground w-[110px] truncate text-right">
                  {e.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
