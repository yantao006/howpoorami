"use client";

import Link from "next/link";
import Script from "next/script";
import { useLanguage } from "@/components/LanguageProvider";

interface FaqItem {
  readonly question: { en: string; zh: string };
  readonly answer: { en: string; zh: string };
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: { en: "What is How Poor Am I?", zh: "“我到底有多穷”是什么？" },
    answer: {
      en: "It is a free tool that shows roughly where you stand in your country's wealth distribution, and how your position compares with both the median person and the very richest.",
      zh: "这是一个免费工具，用来估算你在本国财富分布中的位置，并把你与普通人中位数以及最顶层富豪放在同一张图里比较。",
    },
  },
  {
    question: { en: "How is my percentile calculated?", zh: "我的百分位是怎么算出来的？" },
    answer: {
      en: "The calculator uses WID.world wealth-share data and interpolates between known percentile boundaries to estimate where your net wealth would fall.",
      zh: "计算器基于 WID.world 的财富份额数据，在已知分位点之间做插值，估算你的净资产大概落在什么位置。",
    },
  },
  {
    question: { en: "What counts as net wealth?", zh: "什么算作净资产？" },
    answer: {
      en: "Net wealth means total assets minus total debts. Property, savings, investments, and pension pots count as assets; mortgages, loans, and credit card balances count as debts.",
      zh: "净资产就是总资产减去总负债。房产、存款、投资、养老金账户算资产；房贷、消费贷、信用卡欠款等算负债。",
    },
  },
  {
    question: { en: "Is my data stored?", zh: "我的数据会被保存吗？" },
    answer: {
      en: "No. The calculations run locally in your browser. Your financial inputs are not uploaded to a server.",
      zh: "不会。所有计算都在浏览器本地完成，你输入的收入、财富和补充信息都不会上传到服务器。",
    },
  },
  {
    question: { en: "Should I enter pre-tax or post-tax income?", zh: "收入应该填税前还是税后？" },
    answer: {
      en: "Use gross pre-tax income. The underlying comparison data is based on pre-tax national income, so tax-before figures are closer to the dataset.",
      zh: "建议填写税前总收入。因为底层对比数据使用的是税前国民收入口径，税前数字更接近数据定义。",
    },
  },
  {
    question: { en: "How accurate is the income-to-wealth estimate?", zh: "按收入估算财富有多准？" },
    answer: {
      en: "It is an estimate, not a statement of fact. The refinement factors narrow the range, but if you know your net wealth directly, that will always be more reliable.",
      zh: "它本质上是估算，不是精确结论。补充因素可以缩小范围，但如果你直接知道自己的净资产，直接填净资产一定更可靠。",
    },
  },
  {
    question: { en: "Where does the data come from?", zh: "数据来自哪里？" },
    answer: {
      en: "The site mainly uses WID.world, OECD, World Bank, FRED, and Forbes Real-Time Billionaires, with exchange-rate conversion layered on top where needed.",
      zh: "站点主要使用 WID.world、OECD、世界银行、FRED 和福布斯实时亿万富豪榜的数据，并在需要时叠加汇率换算。",
    },
  },
  {
    question: { en: "Is this financial advice?", zh: "这算金融建议吗？" },
    answer: {
      en: "No. This is an educational visualization tool for understanding wealth inequality, not personal financial, tax, or investment advice.",
      zh: "不算。这是一个帮助理解财富不平等的教育型可视化工具，不提供个人理财、税务或投资建议。",
    },
  },
];

function buildFaqJsonLd(items: readonly FaqItem[], language: "en" | "zh"): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question[language],
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer[language],
      },
    })),
  });
}

export default function FaqContent() {
  const { language } = useLanguage();

  return (
    <>
      <Script
        id="faq-jsonld"
        key={language}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: buildFaqJsonLd(FAQ_ITEMS, language) }}
      />

      <main className="bg-bg-primary text-text-primary min-h-screen pt-20 pb-16 px-4">
        <article className="max-w-3xl mx-auto">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold mb-4">
            {language === "zh" ? "常见问题" : "Frequently Asked Questions"}
          </h1>

          <p className="text-text-secondary text-lg leading-relaxed mb-10">
            {language === "zh"
              ? "这里集中回答这个工具最常见的问题：它怎么计算、数据来自哪里、以及结果该如何理解。"
              : "Answers to the most common questions about how the tool works, where the data comes from, and how to interpret the results."}
          </p>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question.en}
                className="group border border-text-secondary/20 rounded-lg"
              >
                <summary className="cursor-pointer select-none px-5 py-4 font-[family-name:var(--font-heading)] text-lg font-bold list-none flex items-center justify-between gap-4">
                  <span>{item.question[language]}</span>
                  <span
                    className="shrink-0 text-text-secondary transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-text-secondary leading-relaxed">
                  {item.answer[language]}
                </div>
              </details>
            ))}
          </div>

          <nav className="flex gap-6 text-sm mt-12" aria-label="Related pages">
            <Link href="/" className="text-accent-periwinkle hover:underline">
              {language === "zh" ? "返回计算器" : "Back to calculator"}
            </Link>
            <Link href="/about" className="text-accent-periwinkle hover:underline">
              {language === "zh" ? "关于" : "About"}
            </Link>
            <Link href="/methodology" className="text-accent-periwinkle hover:underline">
              {language === "zh" ? "方法说明" : "Methodology"}
            </Link>
          </nav>
        </article>
      </main>
    </>
  );
}
