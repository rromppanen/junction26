import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter for everything: calm, clinical and very legible in tables and figures.
const sans = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: {
    default: "Läpi: every patient through the cancer pathway",
    // A page sets only its own name ("Lappi", "Page not found"); the product name follows.
    template: "%s | Läpi",
  },
  description:
    "Which wellbeing services counties fall behind the rest of Finland on cancer care, at which step of the pathway, and what each one could do next.",
  applicationName: "Läpi",
};

export const viewport: Viewport = {
  themeColor: "#f5f8f7",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} antialiased`}>{children}</body>
    </html>
  );
}
