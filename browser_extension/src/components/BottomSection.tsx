import type { Language } from "../utils/translations";

interface BottomSectionProps {
  onNavigate: (view: "dashboard" | "settings" | "help" | "history") => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: {
    tagline: string;
    settings: string;
    help: string;
  };
}

export default function BottomSection({
  onNavigate,
  language,
  onLanguageChange,
  t,
}: BottomSectionProps) {
  return (
    <div className="mt-4 flex flex-col gap-3.5">
      <div className="h-px bg-slate-200"></div>

      {/* Slogan */}
      <div className="text-center">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {t.tagline}
        </span>
      </div>

      {/* Actions row */}
      <div className="flex justify-between items-center px-1">
        {/* Settings */}
        <button
          onClick={() => onNavigate("settings")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {t.settings}
        </button>

        {/* Help */}
        <button
          onClick={() => onNavigate("help")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t.help}
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => onLanguageChange(language === "en" ? "ne" : "en")}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-xs font-bold text-slate-600 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          {language === "en" ? "नेपाली" : "English"}
        </button>
      </div>
    </div>
  );
}
