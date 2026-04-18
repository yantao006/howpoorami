import type { Metadata } from "next";
import MethodologyContent from "@/components/MethodologyContent";

export const metadata: Metadata = {
  title: "Methodology / 方法说明 — How Poor Am I?",
  description:
    "Technical methodology behind How Poor Am I? — data sources, wealth estimation model, percentile calculations, and limitations.",
  alternates: {
    canonical: "https://howpoorami.org/methodology",
  },
  openGraph: {
    title: "Methodology / 方法说明 — How Poor Am I?",
    description:
      "Technical methodology behind How Poor Am I? — data sources, wealth estimation model, percentile calculations, and limitations.",
  },
};

export default function MethodologyPage() {
  return <MethodologyContent />;
}
