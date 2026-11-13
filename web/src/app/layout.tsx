import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin", "latin-ext"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Gap Radar — Equal cancer care across Finland",
  description:
    "Where does your wellbeing services county fall behind on cancer care, at which pathway stage, and what to do about it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>{children}</body>
    </html>
  );
}
