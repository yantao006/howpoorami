"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  en: {
    title: "About How Poor Am I?",
    intro:
      "How Poor Am I? is a free tool that makes wealth inequality tangible. Instead of abstract coefficients and percentile tables, it shows where you stand in your country's wealth distribution and how far that is from the very top.",
    howItWorks: "How It Works",
    modesIntro: "The site has two main modes:",
    mode1Title: "Wealth Percentile",
    mode1Body:
      "Enter your net wealth, or estimate it from income with refinement factors, to see roughly where you sit in the national wealth distribution.",
    mode2Title: "Billionaire Comparison",
    mode2Body:
      "Compare your annual income with the wealthiest person in your country and translate that gap into years, lifetimes, and historical scales.",
    dataTitle: "Data Sources",
    dataIntro:
      "The calculations are grounded in public datasets and academic inequality research:",
    sources: [
      "WID.world — wealth shares by percentile group and core inequality statistics.",
      "OECD / World Bank / FRED — economic indicators such as wages, prices, population, and housing data.",
      "Forbes Real-Time Billionaires — billionaire net worth snapshots used in the comparison mode.",
    ],
    openTitle: "Open Source",
    openBody:
      "The project is open source under the MIT License. You can inspect the code, review the data pipeline, suggest improvements, or run your own copy.",
    privacyTitle: "Privacy",
    privacyBody:
      "All calculations happen in your browser. Your income, wealth, and refinement inputs are not sent to any server.",
    back: "Back to calculator",
    methodology: "Methodology",
  },
  zh: {
    title: "关于“我到底有多穷”",
    intro:
      "“我到底有多穷”是一个把财富不平等具体化的免费工具。它不只是给你一串抽象系数，而是直接告诉你：你在本国财富分布里站在哪一层，与你和顶层之间到底差了多远。",
    howItWorks: "它如何工作",
    modesIntro: "网站目前主要有两个模式：",
    mode1Title: "财富百分位",
    mode1Body:
      "输入你的净资产，或先输入收入再结合补充信息估算净资产，系统会给出你在该国财富分布中的大致位置。",
    mode2Title: "亿万富豪对比",
    mode2Body:
      "把你的年收入和本国最富有的人放在一起比较，再把差距换算成年数、人生跨度和历史尺度。",
    dataTitle: "数据来源",
    dataIntro:
      "站点中的核心计算依赖公开数据库和不平等研究资料：",
    sources: [
      "WID.world：提供按百分位分组的财富份额和核心不平等指标。",
      "OECD / 世界银行 / FRED：提供工资、价格、人口和房价等经济指标。",
      "福布斯实时亿万富豪榜：用于亿万富豪对比模式中的净资产快照。",
    ],
    openTitle: "开源",
    openBody:
      "项目基于 MIT License 开源。你可以直接查看代码、检查数据处理流程、提出改进建议，或者自己部署一份副本。",
    privacyTitle: "隐私",
    privacyBody:
      "所有计算都在你的浏览器里完成。你的收入、财富和补充输入不会发送到任何服务器。",
    back: "返回计算器",
    methodology: "查看方法说明",
  },
} as const;

export default function AboutContent() {
  const { language } = useLanguage();
  const t = copy[language];

  return (
    <main className="bg-bg-primary text-text-primary min-h-screen pt-20 pb-16 px-4">
      <article className="max-w-3xl mx-auto">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold mb-8">
          {t.title}
        </h1>

        <p className="text-text-secondary text-lg leading-relaxed mb-10">
          {t.intro}
        </p>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">
            {t.howItWorks}
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">{t.modesIntro}</p>
          <ul className="list-disc list-inside text-text-secondary leading-relaxed space-y-2 ml-2">
            <li>
              <strong className="text-text-primary">{t.mode1Title}</strong> {language === "zh" ? "— " : "— "}
              {t.mode1Body}
            </li>
            <li>
              <strong className="text-text-primary">{t.mode2Title}</strong> {language === "zh" ? "— " : "— "}
              {t.mode2Body}
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">
            {t.dataTitle}
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">{t.dataIntro}</p>
          <ul className="list-disc list-inside text-text-secondary leading-relaxed space-y-2 ml-2">
            {t.sources.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">
            {t.openTitle}
          </h2>
          <p className="text-text-secondary leading-relaxed">{t.openBody}</p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">
            {t.privacyTitle}
          </h2>
          <p className="text-text-secondary leading-relaxed">{t.privacyBody}</p>
        </section>

        <nav className="flex gap-6 text-sm" aria-label="Related pages">
          <Link href="/" className="text-accent-periwinkle hover:underline">
            {t.back}
          </Link>
          <Link href="/methodology" className="text-accent-periwinkle hover:underline">
            {t.methodology}
          </Link>
        </nav>
      </article>
    </main>
  );
}
