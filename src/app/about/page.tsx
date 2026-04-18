import type { Metadata } from "next";
import AboutContent from "@/components/AboutContent";

export const metadata: Metadata = {
  title: "About / 关于 — How Poor Am I?",
  description:
    "How Poor Am I is a free, open-source tool that visualizes global wealth inequality using data from WID.world, OECD, and SWIID.",
  alternates: {
    canonical: "https://howpoorami.org/about",
  },
  openGraph: {
    title: "About / 关于 — How Poor Am I?",
    description:
      "How Poor Am I is a free, open-source tool that visualizes global wealth inequality using data from WID.world, OECD, and SWIID.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
