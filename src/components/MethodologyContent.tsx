"use client";

import Link from "next/link";
import TaxSourcesTable from "@/components/TaxSourcesTable";
import { useLanguage } from "@/components/LanguageProvider";

const sections = {
  en: {
    title: "Methodology",
    intro:
      "This page explains the core assumptions behind the calculator: where the data comes from, how percentile placement works, and where the model is approximate.",
    wealthTitle: "Wealth Distribution Data",
    wealthBody:
      "Wealth-share data mainly comes from WID.world. The site uses percentile group boundaries such as the bottom 50%, middle 40%, top 10%, and top 1% to place your wealth into a national distribution.",
    estimateTitle: "Income-to-Wealth Estimation",
    estimateBody:
      "When you enter income rather than net wealth, the site estimates a likely wealth range using additional demographic and financial factors. This narrows uncertainty, but it remains an estimate.",
    percentileTitle: "Percentile Calculation",
    percentileBody:
      "Your estimated wealth is mapped onto known percentile anchors using interpolation. Real-world wealth distributions are not perfectly linear, so the result should be treated as an informed approximation.",
    billionaireTitle: "Billionaire Comparison",
    billionaireBody:
      "The comparison mode uses billionaire net-worth snapshots and divides that wealth by your annual income. It intentionally ignores taxes, spending, and compound returns because the goal is scale, not personal planning.",
    taxTitle: "Tax Rate Data Sources",
    taxBody:
      "Effective tax-rate comparisons are compiled from academic papers and official statistics. Unlike the wealth distribution data, these sources are not available through one standardized API.",
    limitsTitle: "Limitations",
    limits: [
      "Top-end wealth is difficult to measure and may still be understated, even in improved datasets.",
      "Income-based estimation is statistical rather than personalized financial accounting.",
      "Data quality varies by country, especially where tax-based wealth records are limited.",
    ],
    freshnessTitle: "Data Freshness",
    freshnessBody:
      "The site bundles data at build time. It does not make live API calls in the browser, so updates depend on rerunning the fetch pipeline and rebuilding the site.",
    back: "Back to calculator",
    about: "About",
  },
  zh: {
    title: "方法说明",
    intro:
      "这一页解释计算器背后的核心假设：数据来自哪里、百分位是如何定位的，以及哪些地方本质上只能做近似估算。",
    wealthTitle: "财富分布数据",
    wealthBody:
      "财富份额数据主要来自 WID.world。网站利用底部 50%、中间 40%、前 10%、前 1% 等分组边界，把你的财富放进一个国家级分布里定位。",
    estimateTitle: "从收入估算财富",
    estimateBody:
      "当你输入的是收入而不是净资产时，系统会结合年龄、住房、储蓄和债务等因素，估算一个更可能的财富区间。它能缩小误差，但依然只是估算。",
    percentileTitle: "百分位计算",
    percentileBody:
      "系统会把你的估算财富映射到已知分位锚点之间，并通过插值求出大致位置。真实世界的财富分布并不是严格线性的，因此结果应该理解为“有根据的近似值”。",
    billionaireTitle: "亿万富豪对比",
    billionaireBody:
      "对比模式使用亿万富豪的净资产快照，再除以你的年收入，得到“需要多少年才能追平”。它故意忽略税收、支出和复利，因为目标是呈现尺度感，而不是做理财规划。",
    taxTitle: "税率数据来源",
    taxBody:
      "不同财富阶层的有效税率来自学术论文和官方统计整理。和财富分布数据不同，这类数据并没有统一标准 API，需要单独汇编。",
    limitsTitle: "局限性",
    limits: [
      "顶层财富最难精确测量，即使在较好的数据里也可能被低估。",
      "按收入估算财富是统计模型，不是针对个人账本的精算。",
      "不同国家的数据质量差异很大，尤其是在税基和财富登记不完整的地区。",
    ],
    freshnessTitle: "数据时效性",
    freshnessBody:
      "网站在构建时把数据打包进静态页面，不会在浏览器里实时请求外部 API。因此是否更新，取决于是否重新抓取数据并重新构建站点。",
    back: "返回计算器",
    about: "关于",
  },
} as const;

export default function MethodologyContent() {
  const { language } = useLanguage();
  const t = sections[language];

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
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">{t.wealthTitle}</h2>
          <p className="text-text-secondary leading-relaxed">{t.wealthBody}</p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">{t.estimateTitle}</h2>
          <p className="text-text-secondary leading-relaxed">{t.estimateBody}</p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">{t.percentileTitle}</h2>
          <p className="text-text-secondary leading-relaxed">{t.percentileBody}</p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">{t.billionaireTitle}</h2>
          <p className="text-text-secondary leading-relaxed">{t.billionaireBody}</p>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">{t.taxTitle}</h2>
          <p className="text-text-secondary leading-relaxed mb-6">{t.taxBody}</p>
          <TaxSourcesTable />
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">{t.limitsTitle}</h2>
          <ul className="list-disc list-inside text-text-secondary leading-relaxed space-y-2 ml-2">
            {t.limits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-4">{t.freshnessTitle}</h2>
          <p className="text-text-secondary leading-relaxed">{t.freshnessBody}</p>
        </section>

        <nav className="flex gap-6 text-sm" aria-label="Related pages">
          <Link href="/" className="text-accent-periwinkle hover:underline">
            {t.back}
          </Link>
          <Link href="/about" className="text-accent-periwinkle hover:underline">
            {t.about}
          </Link>
        </nav>
      </article>
    </main>
  );
}
