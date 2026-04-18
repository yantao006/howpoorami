"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const FOOTER_LINKS = {
  en: [
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/methodology", label: "Methodology" },
  ],
  zh: [
    { href: "/about", label: "关于" },
    { href: "/faq", label: "常见问题" },
    { href: "/methodology", label: "方法说明" },
  ],
} as const;

/** Build date stamped at module evaluation time (static export). */
const BUILD_DATE = new Date().toISOString().split("T")[0];

export default function Footer() {
  const { language } = useLanguage();
  const links = FOOTER_LINKS[language];

  return (
    <footer className="border-t border-border-subtle px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto text-center">
        <nav aria-label={language === "zh" ? "页脚导航" : "Footer navigation"} className="flex items-center justify-center gap-4 text-sm text-text-muted">
          {links.map((link, index) => (
            <span key={link.href} className="flex items-center gap-4">
              {index > 0 && (
                <span aria-hidden="true" className="text-border-subtle">
                  &middot;
                </span>
              )}
              <Link
                href={link.href}
                className="hover:text-accent-periwinkle transition-colors duration-200"
              >
                {link.label}
              </Link>
            </span>
          ))}
          <span aria-hidden="true" className="text-border-subtle">
            &middot;
          </span>
          <a
            href="https://github.com/yrunhaar/howpoorami"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-periwinkle transition-colors duration-200"
          >
            GitHub
          </a>
        </nav>
        <p className="text-xs text-text-muted/60 mt-3">
          {language === "zh" ? `数据构建日期 ${BUILD_DATE}` : `Data built ${BUILD_DATE}`}
        </p>
      </div>
    </footer>
  );
}
