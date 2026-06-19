import { useState } from "react";

interface HistoryViewProps {
  onNavigate: (view: "dashboard" | "settings" | "help" | "history") => void;
  t: {
    back: string;
    activityLog: string;
    recentScans: string;
    clearLog: string;
    allCleared: string;
    activeShieldRunning: string;
    safe: string;
    suspicious: string;
    flagged: string;
    platformMarketplace: string;
  };
}

interface LogEntry {
  id: number;
  platform: "Facebook" | "Instagram" | "TikTok";
  seller: string;
  item: string;
  status: "safe" | "suspicious" | "flagged";
  time: string;
}

export default function HistoryView({ onNavigate, t }: HistoryViewProps) {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      platform: "Facebook",
      seller: "Alex Martinez",
      item: "PlayStation 5 Console",
      status: "flagged",
      time: "12m ago",
    },
    {
      id: 2,
      platform: "Instagram",
      seller: "vintage_kickz",
      item: "Retro Sneakers Sale",
      status: "suspicious",
      time: "2h ago",
    },
    {
      id: 3,
      platform: "Facebook",
      seller: "Sarah Jenkins",
      item: "Oak Dining Table",
      status: "safe",
      time: "5h ago",
    },
    {
      id: 4,
      platform: "TikTok",
      seller: "gadget_guy_deals",
      item: "Wireless Charging Dock",
      status: "safe",
      time: "Yesterday",
    },
  ]);

  const handleClear = () => {
    setLogs([]);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("settings")}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t.back}
        </button>
        <span className="text-sm font-bold text-slate-700">{t.activityLog}</span>
      </div>

      {/* Logs Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            {t.recentScans}
          </span>
          {logs.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 font-bold transition-colors"
            >
              {t.clearLog}
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-full">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                {t.allCleared}
              </span>
              <span className="text-[10px] text-slate-400">
                {t.activeShieldRunning}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-2.5 rounded-xl border border-slate-50 bg-slate-50/20 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 max-w-[170px]">
                  <span className="text-[11px] font-bold text-slate-700 truncate">
                    {log.item}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium truncate">
                    {log.platform} {t.platformMarketplace} • {log.seller}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {log.time}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      log.status === "safe"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : log.status === "suspicious"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}
                  >
                    {t[log.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
