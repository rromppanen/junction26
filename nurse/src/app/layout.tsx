import type { Metadata, Viewport } from "next";
import { Open_Sans, Poppins } from "next/font/google";
import "./globals.css";

// The same HUS type pairing as the user app in web/: Open Sans for text, Poppins for headings.
const sans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin", "latin-ext", "cyrillic"] });
const heading = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: {
    default: "Screening nurse | Farmagusta",
    template: "%s | Farmagusta",
  },
  description: "Track screening participation, help people return their samples, and coordinate collection with the laboratory.",
  applicationName: "Farmagusta screening nurse",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${heading.variable} antialiased`}>{children}</body>
    </html>
  );
}
