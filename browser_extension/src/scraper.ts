// src/scraper.ts

export function getCleanLines(): string[] {
  const text = document.body.innerText || "";
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].toLowerCase().includes("unread")) {
      i += 2;
    } else if (lines[i].toLowerCase().includes("new posts")) {
      i += 1;
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result;
}

export function getProductName(lines: string[]): string {
  // 1. Try DOM selector for main page header
  const h1 = document.querySelector("h1");
  if (h1 && h1.textContent) {
    return h1.textContent.trim();
  }

  // 2. Try cleaning browser title
  if (typeof document !== "undefined" && document.title) {
    const cleanTitle = document.title
      .replace(/\s*[|•-]\s*Facebook\s*/i, "")
      .replace(/\s*[|•-]\s*Marketplace\s*/i, "");
    if (cleanTitle) {
      return cleanTitle.trim();
    }
  }

  // 3. Fallback to first line of text
  return lines[0] || "";
}

export function getProductPrice(lines: string[]): string {
  return lines[1] || "";
}

export function getCity(lines: string[]): string {
  const loc = lines.find((l) => l.toLowerCase().includes("location")) || "";
  return loc.split(" ").at(-1) || "";
}

export function getYear(lines: string[]): string {
  const time = lines.find((t) => t.toLowerCase().includes("joined facebook in")) || "";
  return time.split(" ").at(-1) || "";
}

export function daysFromYear(year: string | number): number {
  const start = new Date(`${year}-01-01`);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function getProfileUrl(): string {
  const links = document.querySelectorAll("a");
  const proLinks = Array.from(links).filter(a => a.href.includes("marketplace/profile"));
  const profs = proLinks.map(a => a.href);
  const url = profs[0] || "";
  return url.split("?")[0];
}
