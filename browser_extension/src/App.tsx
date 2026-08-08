import { useState, useEffect } from "react";
import "./App.css";
import TopSection from "./components/top-section";
import DashboardView from "./components/DashboardView";
import SettingsView from "./components/SettingsView";
import HelpView from "./components/HelpView";
import HistoryView from "./components/HistoryView";
import ResultView from "./components/ResultView";
import BottomSection from "./components/BottomSection";
import { translations, type Language } from "./utils/translations";

type View = "dashboard" | "settings" | "help" | "history" | "result";

function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isActive, setIsActive] = useState(true);
  const [language, setLanguage] = useState<Language>("en");

  // Check if the current page is a marketplace item or profile page and if scamradar is active
  const checkMarketplacePage = async (activeState: boolean) => {
    if (typeof chrome !== "undefined" && chrome.tabs?.query) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabUrl = tabs[0]?.url || "";
        const isMarketplace = tabUrl.includes("/marketplace/item/") || tabUrl.includes("/marketplace/profile/");
        if (activeState && isMarketplace) {
          setCurrentView("result");
        }
      } catch (err) {
        console.error("Error querying tabs in App.tsx:", err);
      }
    }
  };

  // Load state from chrome.storage.local on mount and run the marketplace page check
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["isActive", "language"], (result: Record<string, unknown>) => {
        let loadedActive = true;
        if (result) {
          if (result["isActive"] !== undefined) {
            loadedActive = result["isActive"] === true;
            setIsActive(loadedActive);
          }
          if (result["language"] !== undefined && (result["language"] === "en" || result["language"] === "ne")) {
            setLanguage(result["language"] as Language);
          }
        }
        checkMarketplacePage(loadedActive);
      });
    } else {
      // Fallback for development/testing environments
      checkMarketplacePage(isActive);
    }
  }, []);

  const handleActiveChange = (active: boolean) => {
    setIsActive(active);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ isActive: active });
    }
    if (active) {
      checkMarketplacePage(true);
    } else {
      setCurrentView("dashboard");
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
        {currentView === "result" && (
          <ResultView onNavigate={setCurrentView} t={t} />
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
