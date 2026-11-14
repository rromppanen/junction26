import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter for everything: calm, clinical and very legible in tables and figures.
const sans = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: {
    default: "Läpi: every bowel screening sample, from home to care",
    // A page sets only its own name ("Nurse board", "Page not found"); the product name follows.
    template: "%s | Läpi",
  },
  description:
    "A home bowel screening test, a robot pickup and a nurse board that follows every sample until a positive result reaches a colonoscopy.",
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
