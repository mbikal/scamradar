import Radar from "./Radar";
import ToggleSwitch from "./ToggleSwitch";

interface DashboardViewProps {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  onNavigate: (view: "dashboard" | "settings" | "help" | "history") => void;
  t: {
    shieldLabel: string;
  };
}

export default function DashboardView({
  isActive,
  setIsActive,
  t,
}: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Radar Container */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xs">
        <Radar isActive={isActive} size={220} />
      </div>

      {/* Main Protection Toggle */}
      <ToggleSwitch
        checked={isActive}
        onChange={setIsActive}
        label={t.shieldLabel}
      />
    </div>
  );
}
