import { getCleanLines, getCity, getYear, daysFromYear, getProfileUrl, getProductPrice, getProductName } from "./scraper";

interface StorageResult {
  isActive?: boolean;
  language?: "en" | "ne";
}

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

(function () {
  let isActive = true;
  let language: "en" | "ne" = "en";
  let currentUrl = window.location.href;
  let widgetElement: HTMLDivElement | null = null;
  let pollInterval: number | null = null;
  let lastAnalyzedUrl: string | null = null;
  let cachedResult: AnalysisResult | null = null;

  const translations = {
    en: {
      title: "scamRadar",
      subtitle: "Seller Safety Report",
      scanning: "Scanning seller...",
      safetyScore: "Safety Score",
      riskScore: "Risk Score",
      lowRisk: "Low Risk",
      mediumRisk: "Medium Risk",
      highRisk: "High Risk",
      error: "Unable to analyze",
      errorDesc: "Could not connect to ScamRadar backend",
      dismiss: "Dismiss",
      riskPoints: "risk points",
    },
    ne: {
      title: "scamRadar",
      subtitle: "विक्रेता सुरक्षा रिपोर्ट",
      scanning: "विक्रेता स्क्यान गर्दै...",
      safetyScore: "सुरक्षा स्कोर",
      riskScore: "जोखिम स्कोर",
      lowRisk: "कम जोखिम",
      mediumRisk: "मध्यम जोखिम",
      highRisk: "उच्च जोखिम",
      error: "विश्लेषण गर्न सकिएन",
      errorDesc: "ScamRadar ब्याकेन्डमा जडान हुन सकेन",
      dismiss: "हटाउनुहोस्",
      riskPoints: "जोखिम अंक",
    },
  };

  // Initialize from storage
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get(["isActive", "language"], (result: StorageResult) => {
      if (result.isActive !== undefined) {
        isActive = result.isActive;
      }
      if (result.language !== undefined) {
        language = result.language;
      }
      checkAndToggleWidget();
    });

    // Listen for storage changes in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local") {
        if ("isActive" in changes) {
          isActive = changes.isActive.newValue === true;
        }
        if ("language" in changes) {
          language = (changes.language.newValue as "en" | "ne") || "en";
        }
        checkAndToggleWidget();
      }
    });
  } else {
    checkAndToggleWidget();
  }

  // Listen for messages from the popup (ResultView)
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === "getSellerData") {
        scrapeSellerProfile().then((scrapedData) => {
          sendResponse({ success: true, data: scrapedData });
        });
      }
      return true; // Keep message channel open for async response
    });
  }

  async function scrapeSellerProfile(): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};
    const textLines = getCleanLines();

    // Find all text nodes or specific div/span/a tags to scan for patterns
    const elements = Array.from(document.querySelectorAll("span, div, a"));
    
    // 1. Scraping Account Age (e.g., "Joined Facebook in 2015" or "Joined in 2015")
    const joinYearStr = getYear(textLines);
    const joinYear = joinYearStr ? parseInt(joinYearStr, 10) : null;

    if (joinYear && !isNaN(joinYear)) {
      data.account_age_days = daysFromYear(joinYear);
    }

    // 2. Scraping Seller Ratings / Reviews
    let rating: number | null = null;
    let reviews: number | null = null;

    // Approach A: Proximity search starting from "Rating and strengths"
    for (let i = 0; i < elements.length; i++) {
      const text = (elements[i].textContent || "").trim().toLowerCase();
      if (text === "rating and strengths") {
        // Look at the next few elements in the array
        for (let j = i + 1; j < Math.min(elements.length, i + 15); j++) {
          const nextText = (elements[j].textContent || "").trim();
          
          if (rating === null) {
            const ratingMatch = nextText.match(/^([1-5](?:\.[0-9])?)$/);
            if (ratingMatch) {
              rating = parseFloat(ratingMatch[1]);
              continue;
            }
          }
          
          if (reviews === null) {
            const reviewsMatch = nextText.match(/^\((\d+)\)$/);
            if (reviewsMatch) {
              reviews = parseInt(reviewsMatch[1], 10);
              continue;
            }
          }
        }
        break;
      }
    }

    // Approach B: Fallback regex search on all elements if Approach A missed them
    if (rating === null) {
      for (const el of elements) {
        const text = el.textContent || "";
        const ariaLabel = el.getAttribute("aria-label") || "";
        const titleAttr = el.getAttribute("title") || "";
        const combinedText = `${text} ${ariaLabel} ${titleAttr}`;
        
        const ratingMatch = combinedText.match(/([1-5](?:\.[0-9])?)\s*(?:out of 5|rating|stars|\/5)/i);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
          break;
        }
      }
    }

    if (reviews === null) {
      for (const el of elements) {
        const text = el.textContent || "";
        const ariaLabel = el.getAttribute("aria-label") || "";
        const titleAttr = el.getAttribute("title") || "";
        const combinedText = `${text} ${ariaLabel} ${titleAttr}`;
        
        const reviewsMatch = combinedText.match(/(\d+)\s+reviews?/i);
        if (reviewsMatch) {
          reviews = parseInt(reviewsMatch[1], 10);
          break;
        }
      }
    }

    if (rating !== null) data.avg_rating = rating;
    if (reviews !== null) data.num_reviews = reviews;

    // 3. Scraping Verified Seller badge/text
    let sellerVerified = 0;
    let isFbVerified = 0;
    for (const el of elements) {
      const text = el.textContent || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const titleAttr = el.getAttribute("title") || "";
      const combinedText = `${text} ${ariaLabel} ${titleAttr}`.toLowerCase();
      
      if (combinedText.includes("highly rated seller") || combinedText.includes("verified seller")) {
        sellerVerified = 1;
      }
      if (combinedText.includes("verified badge") || combinedText.includes("verified account") || combinedText.includes("highly rated seller") || combinedText.includes("verified seller")) {
        isFbVerified = 1;
      }
    }
    data.seller_verified = sellerVerified;
    data.is_fb_verified = isFbVerified;

    // 4. Scraping Business info
    for (const el of elements) {
      const text = el.textContent || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const titleAttr = el.getAttribute("title") || "";
      const combinedText = `${text} ${ariaLabel} ${titleAttr}`.toLowerCase();
      
      if (combinedText.includes("business license") || combinedText.includes("registered business")) {
        data.has_business_license = 1;
        break;
      }
    }

    // 5. Scrape average response time/rate
    for (const el of elements) {
      const text = el.textContent || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const titleAttr = el.getAttribute("title") || "";
      const combinedText = `${text} ${ariaLabel} ${titleAttr}`.toLowerCase();
      
      if (combinedText.includes("responds within an hour") || combinedText.includes("very responsive")) {
        data.avg_response_time_hours = 1.0;
        data.response_rate = 1.0; // 100%
        break;
      } else if (combinedText.includes("responds within a few hours")) {
        data.avg_response_time_hours = 3.0;
        data.response_rate = 0.9;
        break;
      } else if (combinedText.includes("responds within a day")) {
        data.avg_response_time_hours = 24.0;
        data.response_rate = 0.7;
        break;
      }
    }

    // 6. Listing price
    let priceFound = false;
    for (const el of elements) {
      const text = el.textContent || "";
      const priceMatch = text.match(/(?:Rs\.?|\$|£|€)\s*([\d,]+)/);
      if (priceMatch) {
        const priceVal = parseFloat(priceMatch[1].replace(/,/g, ""));
        if (!isNaN(priceVal) && priceVal > 0) {
          data.avg_listing_price = priceVal;
          priceFound = true;
          break;
        }
      }
    }
    // Fallback using lines helper
    if (!priceFound) {
      const priceStr = getProductPrice(textLines);
      if (priceStr) {
        const priceMatch = priceStr.match(/(?:Rs\.?|\$|£|€|\D)?\s*([\d,]+)/);
        if (priceMatch) {
          const priceVal = parseFloat(priceMatch[1].replace(/,/g, ""));
          if (!isNaN(priceVal) && priceVal > 0) {
            data.avg_listing_price = priceVal;
          }
        }
      }
    }

    // 7. Scrape Friends Count (Facebook specific)
    let friendsCount: number | null = null;
    for (const line of textLines) {
      const friendsMatch = line.match(/([\d.,KkMmb]+)\s+friends/i);
      if (friendsMatch) {
        let friendsValStr = friendsMatch[1].replace(/,/g, "");
        if (friendsValStr.toLowerCase().endsWith("k")) {
          friendsCount = parseFloat(friendsValStr) * 1000;
        } else if (friendsValStr.toLowerCase().endsWith("m")) {
          friendsCount = parseFloat(friendsValStr) * 1000000;
        } else {
          friendsCount = parseInt(friendsValStr, 10);
        }
        break;
      }
    }
    // Selector fallback: scan elements with matching texts
    if (friendsCount === null) {
      for (const el of elements) {
        const text = (el.textContent || "").trim();
        const friendsMatch = text.match(/^([\d.,KkMmb]+)\s+friends$/i);
        if (friendsMatch) {
          let friendsValStr = friendsMatch[1].replace(/,/g, "");
          if (friendsValStr.toLowerCase().endsWith("k")) {
            friendsCount = parseFloat(friendsValStr) * 1000;
          } else if (friendsValStr.toLowerCase().endsWith("m")) {
            friendsCount = parseFloat(friendsValStr) * 1000000;
          } else {
            friendsCount = parseInt(friendsValStr, 10);
          }
          break;
        }
      }
    }
    if (friendsCount !== null) {
      data.friends_count = friendsCount;
    }

    // 8. Scrape Photos per Listing
    let numPhotos: number | null = null;
    for (const el of elements) {
      const text = (el.textContent || "").trim();
      const photoMatch = text.match(/^1\s+(?:of|\/)\s+(\d+)$/i);
      if (photoMatch) {
        numPhotos = parseInt(photoMatch[1], 10);
        break;
      }
    }
    // Selector fallback: check dots/carousels or slider tabs count
    if (numPhotos === null) {
      const carouselDots = document.querySelectorAll('div[role="tablist"] button[role="tab"], div[role="button"][tabindex="0"] > span[style*="border-radius"]');
      if (carouselDots.length > 0) {
        numPhotos = carouselDots.length;
      }
    }
    // Image counts fallback
    if (numPhotos === null) {
      const marketplaceImages = document.querySelectorAll('div[role="main"] img, img[alt^="Product image"]');
      if (marketplaceImages.length > 0) {
        numPhotos = marketplaceImages.length;
      }
    }
    if (numPhotos !== null) {
      data.num_photos_per_listing = numPhotos;
    }

    // 9. Scrape Listing Description and Length
    let descriptionLength: number | null = null;
    let descriptionText = "";
    let foundDescHeader = false;
    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i].trim().toLowerCase();
      if (line === "description" || line === "seller's description") {
        const nextLine = textLines[i + 1] || "";
        const nextNextLine = textLines[i + 2] || "";
        const descText = nextLine.length > nextNextLine.length ? nextLine : nextNextLine;
        descriptionText = descText;
        descriptionLength = descText.length;
        foundDescHeader = true;
        break;
      }
    }
    if (!foundDescHeader) {
      const descContainer = document.querySelector('span[style*="-webkit-line-clamp"], div[style*="-webkit-line-clamp"]');
      if (descContainer && descContainer.textContent) {
        descriptionText = descContainer.textContent;
        descriptionLength = descContainer.textContent.length;
        foundDescHeader = true;
      }
    }
    // Selector fallback: find description text block via hierarchy
    if (descriptionLength === null) {
      for (const el of elements) {
        const text = (el.textContent || "").trim().toLowerCase();
        if (text === "description" || text === "seller's description") {
          const parent = el.parentElement;
          if (parent && parent.textContent) {
            descriptionText = parent.textContent.substring(text.length).trim();
            descriptionLength = descriptionText.length;
            break;
          }
        }
      }
    }
    if (descriptionLength !== null) {
      data.description_length = descriptionLength;
      data.product_description = descriptionText;
    }

    // 10. Scrape Location Matches Listing
    let listingCity = "";
    for (const line of textLines) {
      if (line.toLowerCase().includes("listed in") || line.toLowerCase().includes("lives in")) {
        const cityMatch = line.match(/(?:listed|lives)\s+in\s+([^,\n\r]+)/i);
        if (cityMatch) {
          listingCity = cityMatch[1].trim().toLowerCase();
          break;
        }
      }
    }
    const profileCity = getCity(textLines).toLowerCase();
    if (listingCity && profileCity) {
      data.location_matches_listing = (listingCity.includes(profileCity) || profileCity.includes(listingCity)) ? 1 : 0;
    }

    // 11. Scrape Seller Profile URL
    const sellerProfileUrl = getProfileUrl();
    if (sellerProfileUrl) {
      data.seller_profile_url = sellerProfileUrl;
    }

    // 12. New features left empty to let backend apply defaults dynamically

    // 13. Resolve Country from Location string
    const city = getCity(textLines);
    if (city) {
      try {
        const countryCode = await new Promise<string>((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: "getCountryFromCity", city },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (response && response.success && response.countryCode) {
                resolve(response.countryCode);
              } else {
                reject(new Error(response?.error || "Unknown"));
              }
            }
          );
        });
        data.seller_country = countryCode;
      } catch (e) {
        console.warn("Could not resolve country for city:", city, e);
      }
    }

    // 14. Scrape Product Title
    const productTitle = getProductName(textLines);
    if (productTitle) {
      data.product_title = productTitle;
    }

    console.log("ScamRadar: Scraped seller profile details:", data);
    return data;
  }

  // Detect SPA page navigations on Facebook Marketplace
  pollInterval = window.setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      checkAndToggleWidget();
    }
  }, 1000);

  function checkAndToggleWidget() {
    const isProductPage = currentUrl.includes("/marketplace/item/");
    const isProfilePage = currentUrl.includes("/marketplace/profile/");

    if (isActive && (isProductPage || isProfilePage)) {
      injectWidget();
    } else {
      removeWidget();
    }
  }

  async function fetchAnalysis(): Promise<AnalysisResult> {
    const scrapedData = await scrapeSellerProfile();
    const sellerData: Record<string, unknown> = {
      url: currentUrl,
      ...scrapedData,
    };

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "analyzeSeller", data: sellerData },
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
  }

  function getRiskColor(level: string): { bg: string; text: string; border: string; light: string } {
    switch (level) {
      case "high":
        return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", light: "#fee2e2" };
      case "medium":
        return { bg: "#fffbeb", text: "#d97706", border: "#fde68a", light: "#fef3c7" };
      default:
        return { bg: "#ecfdf5", text: "#10b981", border: "#d1fae5", light: "#d1fae5" };
    }
  }

  function getRiskVerdict(level: string, t: typeof translations.en): string {
    switch (level) {
      case "high": return t.highRisk;
      case "medium": return t.mediumRisk;
      default: return t.lowRisk;
    }
  }

  function getScoreLabel(level: string, t: typeof translations.en): string {
    return level === "low" ? t.safetyScore : t.riskScore;
  }

  function getCheckOrWarnIcon(level: string, color: string): string {
    if (level === "low") {
      return `<svg style="width: 16px; height: 16px; color: ${color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
      </svg>`;
    }
    return `<svg style="width: 16px; height: 16px; color: ${color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>`;
  }

  async function injectWidget() {
    const t = translations[language];

    // If widget exists and we already analyzed this URL, just update language
    if (widgetElement && lastAnalyzedUrl === currentUrl && cachedResult) {
      updateWidgetWithResult(cachedResult, t);
      return;
    }

    // Create widget container if needed
    if (!widgetElement) {
      widgetElement = document.createElement("div");
      widgetElement.id = "scamradar-report-widget";

      Object.assign(widgetElement.style, {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: "999999",
        width: "300px",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#1e293b",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxSizing: "border-box",
        animation: "scamradar-fade-in 0.3s ease-out",
      });

      // Add CSS Keyframe animation block to document head
      if (!document.getElementById("scamradar-injected-styles")) {
        const styleEl = document.createElement("style");
        styleEl.id = "scamradar-injected-styles";
        styleEl.textContent = `
          @keyframes scamradar-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `;
        document.head.appendChild(styleEl);
      }

      document.body.appendChild(widgetElement);
    }

    // Show loading state
    showLoadingState(t);

    // Call the backend
    try {
      const result = await fetchAnalysis();
      cachedResult = result;
      lastAnalyzedUrl = currentUrl;
      updateWidgetWithResult(result, t);

      // Trigger Chrome native desktop notification
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          action: "showNotification",
          data: {
            risk_level: result.risk_level,
            risk_score: result.risk_score
          }
        });
      }
    } catch (err) {
      console.error("ScamRadar: Analysis failed", err);
      showErrorState(t);
    }
  }

  function showLoadingState(t: typeof translations.en) {
    if (!widgetElement) return;
    widgetElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #f59e0b; animation: pulse 1s infinite;"></div>
          <span style="font-weight: 800; font-size: 14px; letter-spacing: -0.3px; color: #0f172a;">
            scam<span style="color: #10b981;">Radar</span>
          </span>
        </div>
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">
          ${t.subtitle}
        </span>
      </div>
      <div style="display: flex; align-items: center; justify-content: center; padding: 20px 0; gap: 8px;">
        <div style="width: 16px; height: 16px; border: 2px solid #10b981; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <span style="font-size: 12px; font-weight: 600; color: #64748b;">${t.scanning}</span>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      </style>
    `;
  }

  function showErrorState(t: typeof translations.en) {
    if (!widgetElement) return;
    widgetElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444;"></div>
          <span style="font-weight: 800; font-size: 14px; letter-spacing: -0.3px; color: #0f172a;">
            scam<span style="color: #10b981;">Radar</span>
          </span>
        </div>
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">
          ${t.subtitle}
        </span>
      </div>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px;">
        <svg style="width: 20px; height: 20px; color: #ef4444; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 12px; font-weight: 700; color: #991b1b;">${t.error}</span>
          <span style="font-size: 10px; color: #b91c1c; margin-top: 2px;">${t.errorDesc}</span>
        </div>
      </div>
      <button id="scamradar-dismiss-btn" style="width: 100%; padding: 8px; background-color: #f1f5f9; border: none; border-radius: 8px; font-size: 11px; font-weight: 700; color: #64748b; cursor: pointer; transition: background-color 0.2s;">
        ${t.dismiss}
      </button>
    `;
    hookDismissButton();
  }

  function updateWidgetWithResult(result: AnalysisResult, t: typeof translations.en) {
    if (!widgetElement) return;

    const colors = getRiskColor(result.risk_level);
    const verdict = getRiskVerdict(result.risk_level, t);
    const scoreLabel = getScoreLabel(result.risk_level, t);
    const mainIcon = getCheckOrWarnIcon(result.risk_level, colors.text);
    const displayScore = result.risk_level === "low"
      ? `${100 - result.risk_score}%`
      : `${result.risk_score}%`;

    // Build risk factors HTML
    const factorsHtml = result.risk_factors.map((factor) => `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; font-weight: 500; color: #475569; padding: 6px 0; border-bottom: 1px solid #f8fafc;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ef4444; flex-shrink: 0;"></div>
          <div style="display: flex; flex-direction: column; min-width: 0;">
            <span style="font-weight: 700; font-size: 11px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${factor.title}</span>
            <span style="font-size: 9px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${factor.description}</span>
          </div>
        </div>
        <span style="font-size: 11px; font-weight: 800; color: #ef4444; flex-shrink: 0;">+${factor.score}</span>
      </div>
    `).join("");

    widgetElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${colors.text};"></div>
          <span style="font-weight: 800; font-size: 14px; letter-spacing: -0.3px; color: #0f172a;">
            scam<span style="color: #10b981;">Radar</span>
          </span>
        </div>
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">
          ${t.subtitle}
        </span>
      </div>

      <div style="background-color: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px;">
        <div style="background-color: ${colors.light}; border: 1px solid ${colors.border}; border-radius: 50%; padding: 6px; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0;">
          ${mainIcon}
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 13px; font-weight: 800; color: #0f172a;">${displayScore} ${scoreLabel}</span>
          <span style="font-size: 10px; font-weight: 600; color: ${colors.text}; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 1px;">
            ${verdict}
          </span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column;">
        ${factorsHtml}
      </div>

      <button id="scamradar-dismiss-btn" style="width: 100%; padding: 8px; background-color: #f1f5f9; border: none; border-radius: 8px; font-size: 11px; font-weight: 700; color: #64748b; cursor: pointer; transition: background-color 0.2s; box-shadow: inset 0 -1px 0 rgba(0,0,0,0.05);">
        ${t.dismiss}
      </button>
    `;

    hookDismissButton();
  }

  function hookDismissButton() {
    if (!widgetElement) return;
    const dismissBtn = widgetElement.querySelector("#scamradar-dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        removeWidget();
        if (pollInterval) {
          window.clearInterval(pollInterval);
          pollInterval = null;
        }
      });
    }
  }

  function removeWidget() {
    if (widgetElement) {
      widgetElement.remove();
      widgetElement = null;
    }
  }
})();
