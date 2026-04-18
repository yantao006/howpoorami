"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function NotFound() {
  const { language } = useLanguage();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl sm:text-8xl font-bold text-accent-periwinkle font-[family-name:var(--font-heading)]">
        404
      </p>
      <h1 className="text-2xl sm:text-3xl text-text-primary mt-4 font-[family-name:var(--font-heading)]">
        {language === "zh" ? "页面未找到" : "Page Not Found"}
      </h1>
      <p className="text-text-secondary mt-4 max-w-md">
        {language === "zh"
          ? "这个页面不存在。也许你并没有想象中那么穷，只是这次走错了路。"
          : "This page doesn't exist. Maybe you're richer than you think — you just took a wrong turn."}
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 rounded-2xl bg-accent-periwinkle/15 text-accent-periwinkle font-medium hover:bg-accent-periwinkle/25 transition-colors"
      >
        {language === "zh" ? "返回首页" : "Back to How Poor Am I?"}
      </Link>
    </main>
  );
}
