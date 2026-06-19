interface TopSectionProps {
  isActive: boolean;
  t: {
    protecting: string;
    paused: string;
  };
}

export default function TopSection({ isActive, t }: TopSectionProps) {
  return (
    <>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <img src="icons/icon48.png" alt="logo" className="w-8 h-8 object-contain" />
          <div className="dm-sans text-lg font-bold text-slate-800">
            scam<span className="text-emerald-600 font-extrabold">Radar</span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${
            isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          ></span>
          {isActive ? t.protecting : t.paused}
        </div>
      </div>
      <div className="h-px bg-slate-200 mb-4"></div>
    </>
  );
}
