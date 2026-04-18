import type { Metadata } from "next";
import FaqContent from "@/components/FaqContent";

export const metadata: Metadata = {
  title: "FAQ / 常见问题 — How Poor Am I?",
  description:
    "Frequently asked questions about How Poor Am I? — data accuracy, methodology, privacy, and how wealth inequality is measured.",
  alternates: {
    canonical: "https://howpoorami.org/faq",
  },
  openGraph: {
    title: "FAQ / 常见问题 — How Poor Am I?",
    description:
      "Frequently asked questions about How Poor Am I? — data accuracy, methodology, privacy, and how wealth inequality is measured.",
  },
};

export default function FaqPage() {
  return <FaqContent />;
}
