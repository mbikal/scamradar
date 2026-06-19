interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors shadow-xs w-full">
      {label && (
        <span className="text-sm font-semibold text-slate-700 select-none">
          {label}
        </span>
      )}
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
      </div>
    </label>
  );
}
