import type { Metadata, Viewport } from "next";
import { Open_Sans, Poppins } from "next/font/google";
import "./globals.css";

// The type pairing of the Finnish public health services (HUS): Open Sans for text, Poppins for headings.
const sans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin", "latin-ext", "cyrillic"] });
const heading = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["500", "600"] });

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
