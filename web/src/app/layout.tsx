import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Care Equity Lab | From evidence to action", description: "Upload a public screening dataset. Automatically standardise, analyse and generate evidence-linked recommendations with Gemini and Context.dev." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
