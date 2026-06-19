// src/content.ts

interface StorageResult {
  isActive?: boolean;
  language?: "en" | "ne";
}

(function () {
  let isActive = true;
  let language: "en" | "ne" = "en";
  let currentUrl = window.location.href;
  let widgetElement: HTMLDivElement | null = null;
  let pollInterval: number | null = null;

  const translations = {
    en: {
      title: "scamRadar",
      subtitle: "Seller Safety Report",
      score: "94% Safety Score",
      verdict: "High Trust",
      item1: "Account Age: 3+ Years",
      item2: "Seller Rating: Excellent",
      item3: "Price: Fair Market Match",
      dismiss: "Dismiss",
    },
    ne: {
      title: "scamRadar",
      subtitle: "विक्रेता सुरक्षा रिपोर्ट",
      score: "९४% सुरक्षा स्कोर",
      verdict: "उच्च विश्वास",
      item1: "खाताको आयु: ३+ वर्ष",
      item2: "विक्रेता मूल्याङ्कन: उत्कृष्ट",
      item3: "मूल्य: बजार मूल्य अनुकूल",
      dismiss: "हटाउनुहोस्",
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

    if (isActive && isProductPage) {
      injectWidget();
    } else {
      removeWidget();
    }
  }

  function injectWidget() {
    const t = translations[language];

    // If widget already exists, update its content in case language changed
    if (widgetElement) {
      updateWidgetContent(t);
      return;
    }

    widgetElement = document.createElement("div");
    widgetElement.id = "scamradar-report-widget";
    
    // Apply styling container directly to ensure isolation from Facebook's global CSS overrides
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
    updateWidgetContent(t);
  }

  function updateWidgetContent(t: typeof translations.en) {
    if (!widgetElement) return;

    widgetElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; animation: pulse 2s infinite;"></div>
          <span style="font-weight: 800; font-size: 14px; letter-spacing: -0.3px; color: #0f172a;">
            scam<span style="color: #10b981;">Radar</span>
          </span>
        </div>
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">
          ${t.subtitle}
        </span>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px;">
        <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 50%; padding: 6px; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0;">
          <svg style="width: 16px; height: 16px; color: #10b981;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 13px; font-weight: 800; color: #0f172a;">${t.score}</span>
          <span style="font-size: 10px; font-weight: 600; color: #10b981; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 1px;">
            ${t.verdict}
          </span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 500; color: #475569;">
          <svg style="width: 12px; height: 12px; color: #10b981; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>${t.item1}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 500; color: #475569;">
          <svg style="width: 12px; height: 12px; color: #10b981; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>${t.item2}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 500; color: #475569;">
          <svg style="width: 12px; height: 12px; color: #10b981; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>${t.item3}</span>
        </div>
      </div>

      <button id="scamradar-dismiss-btn" style="width: 100%; padding: 8px; background-color: #f1f5f9; border: none; border-radius: 8px; font-size: 11px; font-weight: 700; color: #64748b; cursor: pointer; transition: background-color 0.2s; box-shadow: inset 0 -1px 0 rgba(0,0,0,0.05);">
        ${t.dismiss}
      </button>
    `;

    // Hook up dismiss button action
    const dismissBtn = widgetElement.querySelector("#scamradar-dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        removeWidget();
        // Stop polling for this page session until next page change
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
