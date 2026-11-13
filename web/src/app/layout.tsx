import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Care Equity Lab | From evidence to action", description: "Explore public Finnish cancer-screening data, locate measured pathway gaps, and build a sourced improvement plan." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
