"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";

const NAV_ITEMS = {
  en: [
    { href: "/", label: "How Poor Am I?" },
    { href: "/compare", label: "How Long?" },
    { href: "/compare-countries", label: "Compare" },
  ],
  zh: [
    { href: "/", label: "我到底有多穷？" },
    { href: "/compare", label: "要多久？" },
    { href: "/compare-countries", label: "跨国比较" },
  ],
} as const;

export default function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const navItems = NAV_ITEMS[language];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle"
      role="navigation"
      aria-label={language === "zh" ? "主导航" : "Main navigation"}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-sm sm:text-lg font-bold text-text-primary hover:text-accent-periwinkle transition-colors whitespace-nowrap shrink-0"
        >
          {language === "zh" ? "我到底有多穷？" : "How Poor Am I?"}
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const NON_COUNTRY_PATHS = ["/about", "/faq", "/methodology", "/compare"];
            const isActive =
              item.href === "/"
                ? pathname === "/" ||
                  !NON_COUNTRY_PATHS.some((p) => pathname.startsWith(p))
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${
                    isActive
                      ? "bg-accent-periwinkle/15 text-accent-periwinkle"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={toggleLanguage}
            aria-label={
              language === "zh"
                ? "切换到英文"
                : "Switch to Chinese"
            }
            title={
              language === "zh"
                ? "切换到英文"
                : "Switch to Chinese"
            }
            className="ml-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all duration-200"
          >
            {language === "zh" ? "EN" : "中文"}
          </button>

          <button
            onClick={toggleTheme}
            aria-label={
              language === "zh"
                ? `切换到${theme === "dark" ? "浅色" : "深色"}模式`
                : `Switch to ${theme === "dark" ? "light" : "dark"} mode`
            }
            title={
              language === "zh"
                ? `切换到${theme === "dark" ? "浅色" : "深色"}模式`
                : `Switch to ${theme === "dark" ? "light" : "dark"} mode`
            }
            className="ml-1 sm:ml-2 p-1.5 sm:p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all duration-200"
          >
            {theme === "dark" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
