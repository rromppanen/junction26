import type { Metadata, Viewport } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Archivo for interface and figures (its width axis gives a condensed cut for long county names);
// Source Serif only for the written brief, so prose reads differently from data. Its optical-size axis
// lets the large brief headline and the smaller paragraphs each get the cut drawn for that size.
const sans = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin", "latin-ext"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: {
    default: "Gap Radar: cancer care across Finland's counties",
    // A page sets only its own name ("Lappi", "Page not found"); the product name follows.
    template: "%s | Gap Radar",
  },
  description:
    "Which wellbeing services counties fall behind the rest of Finland on cancer care, at which step of the pathway, and what each one could do next.",
  applicationName: "Gap Radar",
};

export const viewport: Viewport = {
  themeColor: "#eef0ec",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>{children}</body>
    </html>
  );
}
