import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Countries — Where Would You Rank?",
  description:
    "Enter your wealth or income once and see where you'd rank across multiple countries. Side-by-side percentile comparison for 30+ nations.",
  keywords: [
    "compare wealth across countries",
    "wealth percentile by country",
    "cross-country wealth comparison",
    "global wealth ranking",
    "income comparison countries",
    "how rich am I in other countries",
    "wealth inequality comparison",
  ],
  openGraph: {
    title: "Compare Countries — Where Would You Rank?",
    description:
      "Same wealth, different country — see how your ranking changes. Side-by-side percentile comparison for 30+ nations.",
  },
  alternates: {
    canonical: "https://howpoorami.org/compare-countries",
  },
};

export default function CompareCountriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
