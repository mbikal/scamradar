// src/background.ts

interface AnalyzeRequest {
  action: "analyzeSeller" | "getCountryFromCity" | "reportSeller" | "showNotification";
  data?: Record<string, unknown>;
  city?: string;
}

chrome.runtime.onMessage.addListener((request: AnalyzeRequest, _sender, sendResponse) => {
  if (request.action === "analyzeSeller" && request.data) {
    fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("ScamRadar Background API request failed:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keeps the message channel open for async response
  } else if (request.action === "reportSeller" && request.data) {
    fetch("http://localhost:3000/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("ScamRadar Background Report request failed:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  } else if (request.action === "getCountryFromCity" && request.city) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(request.city)}`, {
      headers: {
        "User-Agent": "ScamRadar/1.0"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0 && data[0].address && data[0].address.country_code) {
          sendResponse({ success: true, countryCode: data[0].address.country_code.toUpperCase() });
        } else {
          sendResponse({ success: false, error: "Country not found" });
        }
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  } else if (request.action === "showNotification" && request.data) {
    const level = request.data.risk_level as string;
    const score = request.data.risk_score as number;
    const scoreText = level === "low" ? `${100 - score}% Safety Score` : `${score}% Risk Score`;
    const message = `Verdict: ${level.toUpperCase()} (${scoreText})`;

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "ScamRadar Analysis Complete",
      message: message,
      priority: 2
    });
    sendResponse({ success: true });
    return true;
  }
  return false;
});
