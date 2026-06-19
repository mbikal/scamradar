import { useState, useEffect } from "react";
import "./App.css";
import TopSection from "./components/top-section";
import DashboardView from "./components/DashboardView";
import SettingsView from "./components/SettingsView";
import HelpView from "./components/HelpView";
import HistoryView from "./components/HistoryView";
import BottomSection from "./components/BottomSection";
import { translations, type Language } from "./utils/translations";

type View = "dashboard" | "settings" | "help" | "history";

function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isActive, setIsActive] = useState(true);
  const [language, setLanguage] = useState<Language>("en");

  // Load state from chrome.storage.local on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["isActive", "language"], (result: Record<string, unknown>) => {
        if (result) {
          if (result["isActive"] !== undefined) {
            setIsActive(result["isActive"] === true);
          }
          if (result["language"] !== undefined && (result["language"] === "en" || result["language"] === "ne")) {
            setLanguage(result["language"] as Language);
          }
        }
      });
    }
  }, []);

  const handleActiveChange = (active: boolean) => {
    setIsActive(active);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ isActive: active });
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ language: lang });
    }
  };

  const t = translations[language];

  return (
    <div className="w-[340px] bg-slate-50 text-slate-800 p-5 rounded-2xl shadow-md border border-slate-100 flex flex-col gap-4 select-none min-h-[425px]">
      <TopSection isActive={isActive} t={t} />

      <div className="flex-1">
        {currentView === "dashboard" && (
          <DashboardView
            isActive={isActive}
            setIsActive={handleActiveChange}
            onNavigate={setCurrentView}
            t={t}
          />
        )}
        {currentView === "settings" && (
          <SettingsView onNavigate={setCurrentView} t={t} />
        )}
        {currentView === "help" && (
          <HelpView onNavigate={setCurrentView} t={t} />
        )}
        {currentView === "history" && (
          <HistoryView onNavigate={setCurrentView} t={t} />
        )}
      </div>

      {currentView === "dashboard" && (
        <BottomSection
          onNavigate={setCurrentView}
          language={language}
          onLanguageChange={handleLanguageChange}
          t={t}
        />
      )}
    </div>
  );
}

export default App;
