import { useState, useEffect } from "react";
import Radar from "./Radar";

interface RiskFactor {
  title: string;
  description: string;
  score: number;
  icon: string;
  feature: string;
}

interface AnalysisResult {
  success: boolean;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  fraud_probability: number;
  risk_factors: RiskFactor[];
}

interface ResultViewProps {
  onNavigate: (view: "dashboard" | "settings" | "help" | "history" | "result") => void;
  t: {
    back: string;
    resultTitle?: string;
    scanning?: string;
    errorTitle?: string;
    errorDesc?: string;
    riskFactorsTitle?: string;
    lowRisk?: string;
    mediumRisk?: string;
    highRisk?: string;
    reportBtn?: string;
    noMarketplace?: string;
    noMarketplaceDesc?: string;
    retryBtn?: string;
  };
}

type Status = "loading" | "success" | "error" | "no-marketplace";

function getRiskColor(level: string) {
  switch (level) {
    case "high":
      return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-200", ring: "stroke-red-500" };
    case "medium":
      return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200", ring: "stroke-amber-500" };
    default:
      return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", ring: "stroke-emerald-500" };
  }
}

function getRiskLabel(level: string, t: ResultViewProps["t"]) {
  switch (level) {
    case "high": return t.highRisk || "High Risk";
    case "medium": return t.mediumRisk || "Medium Risk";
    default: return t.lowRisk || "Low Risk";
  }
}

function getSafetyTip(feature: string): string {
  switch (feature) {
    case "friends_count":
      return "Fake accounts often have few friends to avoid detection. Do not pay in advance using untraceable methods.";
    case "account_age_days":
      return "Newly created accounts are high-risk. Verify the seller's identity and inspect the item before paying.";
    case "is_fb_verified":
      return "Seller verification badge is missing. Exercise extra caution during transactions.";
    case "location_matches_listing":
      return "Listing location mismatch. This can indicate dropshipping or regional classification scams.";
    case "num_photos_per_listing":
      return "Very few photos provided. Ask the seller for live/additional photos of the product.";
    case "avg_listing_price":
    case "price_vs_category_median":
      return "The price is significantly lower than average. If a deal seems too good to be true, it usually is.";
    default:
      return "Inspect the seller profile carefully. Insist on cash on delivery or meeting in a secure, public place.";
  }
}

export default function ResultView({ onNavigate, t }: ResultViewProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  useEffect(() => {
    runAnalysis();
  }, []);

  async function runAnalysis() {
    setStatus("loading");

    try {
      // Get current tab URL and ID
      let tabUrl = "";
      let tabId = 0;
      if (typeof chrome !== "undefined" && chrome.tabs?.query) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tabUrl = tabs[0]?.url || "";
        tabId = tabs[0]?.id || 0;
      }

      const isMarketplace = tabUrl.includes("/marketplace/item/") || tabUrl.includes("/marketplace/profile/");
      if (!isMarketplace) {
        setStatus("no-marketplace");
        return;
      }

      // Request scraped seller data from the active tab's content script
      let scrapedData = {};
      if (tabId && typeof chrome !== "undefined" && chrome.tabs?.sendMessage) {
        try {
          scrapedData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { action: "getSellerData" }, (response) => {
              if (chrome.runtime.lastError) {
                // Marks the lastError as checked so Chrome does not log an unhandled error
                resolve({});
                return;
              }
              if (response && response.success && response.data) {
                resolve(response.data);
              } else {
                resolve({});
              }
            });
            // Set a fallback timeout of 800ms
            setTimeout(() => resolve({}), 800);
          });
        } catch (e) {
          console.warn("Failed to retrieve seller data from page content script:", e);
        }
      }

      const data: AnalysisResult = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: "analyzeSeller",
            data: {
              url: tabUrl,
              ...scrapedData,
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response && response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response?.error || "Analysis failed"));
            }
          }
        );
      });

      setResult(data);
      setStatus("success");
    } catch (err) {
      console.error("ScamRadar analysis failed:", err);
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Back button */}
      <button
        onClick={() => onNavigate("dashboard")}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors self-start"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t.back}
      </button>

      {/* Loading state */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-4 gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xs">
            <Radar isActive={true} size={180} />
          </div>
          <span className="text-xs font-semibold text-slate-400 animate-pulse">
            {t.scanning || "Scanning seller..."}
          </span>
        </div>
      )}

      {/* Not a marketplace page */}
      {status === "no-marketplace" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{t.noMarketplace || "Not a Marketplace page"}</p>
            <p className="text-[10px] text-slate-400 mt-1">{t.noMarketplaceDesc || "Navigate to a Facebook Marketplace listing to scan"}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{t.errorTitle || "Analysis Failed"}</p>
            <p className="text-[10px] text-slate-400 mt-1">{t.errorDesc || "Could not connect to ScamRadar backend"}</p>
          </div>
          <button
            onClick={runAnalysis}
            className="mt-1 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors"
          >
            {t.retryBtn || "Retry"}
          </button>
        </div>
      )}

      {/* Success — Results */}
      {status === "success" && result && (
        <>
          {/* Score ring */}
          <div className={`${getRiskColor(result.risk_level).bg} border ${getRiskColor(result.risk_level).border} rounded-2xl p-4 flex items-center gap-4`}>
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  className={getRiskColor(result.risk_level).ring}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.risk_score / 100) * 175.9} 175.9`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-base font-extrabold ${getRiskColor(result.risk_level).text}`}>
                  {result.risk_score}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-extrabold uppercase tracking-wider ${getRiskColor(result.risk_level).text}`}>
                {getRiskLabel(result.risk_level, t)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {(result.fraud_probability * 100).toFixed(0)}% fraud probability
              </span>
            </div>
          </div>

          {/* Risk factors */}
          {result.risk_factors && result.risk_factors.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                {t.riskFactorsTitle || "Risk Factors"}
              </span>
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                {result.risk_factors.map((factor, i) => {
                  const isExpanded = expandedFactor === factor.feature;
                  return (
                    <div
                      key={factor.feature}
                      onClick={() => setExpandedFactor(isExpanded ? null : factor.feature)}
                      className={`flex flex-col px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                        i < result.risk_factors.length - 1 ? "border-b border-slate-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-slate-800 truncate">{factor.title}</span>
                            <span className="text-[9px] text-slate-400 truncate">{factor.description}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[11px] font-extrabold text-red-500">
                            +{factor.score}
                          </span>
                          <svg
                            className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-2 p-2 bg-red-50/50 border border-red-100/50 rounded-lg text-[9px] text-red-700 leading-normal">
                          <span className="font-bold block mb-0.5">Safety Tip:</span>
                          {getSafetyTip(factor.feature)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </>
      )}
    </div>
  );
}
