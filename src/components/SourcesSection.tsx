"use client";

import { DATA_SOURCES } from "@/data/wealth-data";
import { useLanguage } from "@/components/LanguageProvider";

export default function SourcesSection() {
  const { language } = useLanguage();

  return (
    <section className="border-t border-border-subtle pt-16">
      <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-center mb-4 text-text-primary">
        {language === "zh" ? "数据来源与方法说明" : "Data Sources & Methodology"}
      </h3>
      <p className="text-text-secondary text-center text-sm max-w-2xl mx-auto mb-12">
        {language === "zh"
          ? "本可视化使用的所有数据都来自同行评审研究和官方统计数据库。财富份额指成年人口（20 岁以上）的个人净资产（资产减负债），伴侣资产按 equal-split 方法拆分。"
          : "All data in this visualization comes from peer-reviewed academic research and official statistical databases. Wealth shares refer to personal net wealth (assets minus debts) among the adult population (20+), using the equal-split method for couples."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {DATA_SOURCES.map((source) => (
          <div
            key={source.url}
            className="bg-bg-card border border-border-subtle rounded-xl p-5"
          >
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-periwinkle hover:text-accent-lavender transition-colors font-medium text-sm"
            >
              {source.name[language]} ↗
            </a>
            <p className="text-text-secondary text-xs mt-2 leading-relaxed">
              {source.description[language]}
            </p>
            {"citation" in source && source.citation && (
              <p className="text-text-muted text-xs mt-2 italic">
                {source.citation[language]}
              </p>
            )}
            {"accessed" in source && source.accessed && (
              <p className="text-text-muted text-xs mt-1">
                {language === "zh" ? `访问时间：${source.accessed}` : `Accessed: ${source.accessed}`}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-text-muted text-xs max-w-xl mx-auto leading-relaxed">
          {language === "zh"
            ? "本可视化仅用于教育和公共认知。财富不平等的测量涉及复杂的方法选择，不同的财富定义、分析单位和数据来源会产生不同估计。若需获取最新数据，请访问 "
            : "This visualization is for educational purposes. Wealth inequality measurement involves complex methodological choices. Different definitions of wealth, unit of analysis, and data sources can produce varying estimates. For the most up-to-date data, visit "}{" "}
          <a
            href="https://wid.world"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-periwinkle hover:underline"
          >
            WID.world
          </a>
          .
        </p>
        <p className="text-text-muted text-xs mt-6">
          {language === "zh"
            ? "基于公开数据构建，不会收集或存储任何个人信息。"
            : "Built with publicly available data. No personal data is collected or stored."}
        </p>
      </div>
    </section>
  );
}
