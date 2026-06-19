import { useState } from "react";

interface SettingsViewProps {
  onNavigate: (view: "dashboard" | "settings" | "help" | "history") => void;
  t: {
    back: string;
    settings: string;
    activeMarketplaces: string;
    fb: string;
    ig: string;
    tt: string;
    sensitivity: string;
    sensLow: string;
    sensMed: string;
    sensHigh: string;
    pushWarnings: string;
    pushDesc: string;
    saveChanges: string;
    settingsSaved: string;
    activityLogLink: string;
  };
}

export default function SettingsView({ onNavigate, t }: SettingsViewProps) {
  const [fbScan, setFbScan] = useState(true);
  const [igScan, setIgScan] = useState(true);
  const [ttScan, setTtScan] = useState(false);
  const [sensitivity, setSensitivity] = useState("medium");
  const [alerts, setAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("dashboard")}
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
        <span className="text-sm font-bold text-slate-700">{t.settings}</span>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-4 shadow-xs">
        {/* Marketplace Selection */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
            {t.activeMarketplaces}
          </span>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-600">
                {t.fb}
              </span>
              <input
                type="checkbox"
                checked={fbScan}
                onChange={(e) => setFbScan(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-600">
                {t.ig}
              </span>
              <input
                type="checkbox"
                checked={igScan}
                onChange={(e) => setIgScan(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-600">
                {t.tt}
              </span>
              <input
                type="checkbox"
                checked={ttScan}
                onChange={(e) => setTtScan(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        <div className="h-px bg-slate-100"></div>

        {/* Sensitivity Option */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
            {t.sensitivity}
          </span>
          <select
            value={sensitivity}
            onChange={(e) => setSensitivity(e.target.value)}
            className="w-full text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="low">{t.sensLow}</option>
            <option value="medium">{t.sensMed}</option>
            <option value="high">{t.sensHigh}</option>
          </select>
        </div>

        <div className="h-px bg-slate-100"></div>

        {/* Browser Alerts Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm font-medium text-slate-600 block">
              {t.pushWarnings}
            </span>
            <span className="text-[10px] text-slate-400">
              {t.pushDesc}
            </span>
          </div>
          <input
            type="checkbox"
            checked={alerts}
            onChange={(e) => setAlerts(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
      </div>

      {/* Navigation to History Logs */}
      <button
        onClick={() => onNavigate("history")}
        className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-300 transition-colors shadow-xs w-full text-slate-600 hover:text-slate-900 group animate-fade-in"
      >
        <span className="text-xs font-semibold">{t.activityLogLink}</span>
        <svg
          className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm shadow-xs ${
          saved
            ? "bg-emerald-600 text-white"
            : "bg-slate-800 text-white hover:bg-slate-700"
        }`}
      >
        {saved ? t.settingsSaved : t.saveChanges}
      </button>
    </div>
  );
}
