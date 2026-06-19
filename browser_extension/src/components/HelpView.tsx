import { useState } from "react";

interface HelpViewProps {
  onNavigate: (view: "dashboard" | "settings" | "help" | "history") => void;
  t: {
    back: string;
    helpTitle: string;
    faqTitle: string;
    faq1Q: string;
    faq1A: string;
    faq2Q: string;
    faq2A: string;
    faq3Q: string;
    faq3A: string;
    contactTitle: string;
    contactDesc: string;
  };
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpView({ onNavigate, t }: HelpViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: t.faq1Q,
      answer: t.faq1A,
    },
    {
      question: t.faq2Q,
      answer: t.faq2A,
    },
    {
      question: t.faq3Q,
      answer: t.faq3A,
    },
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t.back}
        </button>
        <span className="text-sm font-bold text-slate-700">{t.helpTitle}</span>
      </div>

      {/* FAQ Accordion container */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
          {t.faqTitle}
        </span>
        <div className="flex flex-col gap-2">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-100 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 text-left transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-600">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <div className="p-3 bg-white text-[11px] leading-relaxed text-slate-500 border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col items-center justify-center text-center gap-2">
        <div className="p-2 bg-slate-50 rounded-full">
          <svg
            className="w-5 h-5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-700 block">
            {t.contactTitle}
          </span>
          <span className="text-[11px] text-slate-400">
            {t.contactDesc}
          </span>
        </div>
        <a
          href="mailto:support@scamradar.io"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mt-1"
        >
          support@scamradar.io
        </a>
      </div>
    </div>
  );
}
