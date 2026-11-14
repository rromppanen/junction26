import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Same type as the main web app, so the board looks identical when served through it.
const sans = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: {
    default: "Nurse board | Läpi",
    template: "%s | Läpi nurse board",
  },
  description: "Every bowel screening sample on one board, with stuck ones flagged, so no positive result is left waiting for a colonoscopy.",
  applicationName: "Läpi nurse board",
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
