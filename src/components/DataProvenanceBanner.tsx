"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * A compact, always-visible disclaimer that all figures are estimates,
 * with an expandable panel linking to methodology and data sources.
 */
export default function DataProvenanceBanner() {
  const [expanded, setExpanded] = useState(false);
  const { language } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto text-center mb-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-text-muted text-xs hover:text-text-secondary transition-colors inline-flex items-center gap-1.5"
      >
        <span className="inline-block w-3.5 h-3.5 rounded-full border border-text-muted/40 text-[9px] leading-none flex items-center justify-center font-semibold">
          i
        </span>
        {language === "zh"
          ? "所有数字都基于现有公开数据进行估算。"
          : "All figures are estimates based on available data."}{" "}
        <span className="text-accent-periwinkle underline underline-offset-2">
          {expanded
            ? language === "zh"
              ? "收起来源"
              : "Hide sources"
            : language === "zh"
              ? "查看数据来源"
              : "See data sources"}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 bg-bg-card border border-border-subtle rounded-lg p-4 text-left text-xs text-text-secondary animate-fade-in">
          <p className="mb-3 leading-relaxed">
            {language === "zh"
              ? "财富和收入数据在构建时从公开 API 自动抓取，展示数值可能不会覆盖到最新一次发布。"
              : "Wealth and income data is fetched programmatically from public APIs at build time. Values may not reflect the very latest releases."}
          </p>

          <table className="w-full text-[11px] mb-3">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-1 text-text-muted font-medium">{language === "zh" ? "数据" : "Data"}</th>
                <th className="text-left py-1 text-text-muted font-medium">{language === "zh" ? "来源" : "Source"}</th>
                <th className="text-left py-1 text-text-muted font-medium">{language === "zh" ? "类型" : "Type"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              <tr>
                <td className="py-1.5">{language === "zh" ? "财富分布占比" : "Wealth distribution shares"}</td>
                <td className="py-1.5">
                  <a href="https://wid.world" target="_blank" rel="noopener noreferrer" className="text-accent-periwinkle hover:underline">
                    WID.world
                  </a>
                </td>
                <td className="py-1.5 text-text-muted">API</td>
              </tr>
              <tr>
                <td className="py-1.5">{language === "zh" ? "财富与收入均值/中位数" : "Mean/median wealth & income"}</td>
                <td className="py-1.5">
                  <a href="https://wid.world" target="_blank" rel="noopener noreferrer" className="text-accent-periwinkle hover:underline">
                    WID.world
                  </a>
                </td>
                <td className="py-1.5 text-text-muted">API</td>
              </tr>
              <tr>
                <td className="py-1.5">{language === "zh" ? "收入分布占比" : "Income distribution shares"}</td>
                <td className="py-1.5">
                  <a href="https://wid.world" target="_blank" rel="noopener noreferrer" className="text-accent-periwinkle hover:underline">
                    WID.world
                  </a>
                </td>
                <td className="py-1.5 text-text-muted">API</td>
              </tr>
              <tr>
                <td className="py-1.5">{language === "zh" ? "基尼系数" : "Gini coefficients"}</td>
                <td className="py-1.5">
                  <a href="https://wid.world" target="_blank" rel="noopener noreferrer" className="text-accent-periwinkle hover:underline">
                    WID.world
                  </a>
                </td>
                <td className="py-1.5 text-text-muted">API</td>
              </tr>
              <tr>
                <td className="py-1.5">{language === "zh" ? "人口" : "Population"}</td>
                <td className="py-1.5">
                  <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noopener noreferrer" className="text-accent-periwinkle hover:underline">
                    World Bank
                  </a>
                </td>
                <td className="py-1.5 text-text-muted">API</td>
              </tr>
              <tr>
                <td className="py-1.5">{language === "zh" ? "汇率" : "Exchange rates"}</td>
                <td className="py-1.5">
                  <a href="https://www.ecb.europa.eu" target="_blank" rel="noopener noreferrer" className="text-accent-periwinkle hover:underline">
                    ECB
                  </a>
                </td>
                <td className="py-1.5 text-text-muted">API</td>
              </tr>
              <tr>
                <td className="py-1.5">{language === "zh" ? "亿万富豪净资产" : "Billionaire net worth"}</td>
                <td className="py-1.5">
                  <a href="https://www.forbes.com/real-time-billionaires/" target="_blank" rel="noopener noreferrer" className="text-accent-periwinkle hover:underline">
                    Forbes RTB
                  </a>
                </td>
                <td className="py-1.5 text-text-muted">API</td>
              </tr>
              <tr>
                <td className="py-1.5">{language === "zh" ? "有效税率" : "Effective tax rates"}</td>
                <td className="py-1.5">{language === "zh" ? "学术论文" : "Academic papers"}</td>
                <td className="py-1.5 text-text-muted">{language === "zh" ? "人工维护" : "Manual"}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-text-muted leading-relaxed">
            {language === "zh" ? "所有数据都由同一个脚本（" : "All data is fetched by a single script ("}
            <code className="text-text-secondary">scripts/fetch-all-data.mjs</code>
            {language === "zh"
              ? "）在构建时抓取并打包。使用本站时不会再发起外部 API 请求。完整说明见 "
              : ") and bundled at build time. No API calls are made when you use the tool. For full details, see "}
            <Link href="/methodology" className="text-accent-periwinkle hover:underline">
              {language === "zh" ? "方法说明" : "Methodology"}
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
