import type { NextConfig } from "next";

// The nurse board is its own app (../nurse), served under /nurse.
// Forwarding it through this app keeps both on one origin, so the board shares
// localStorage and BroadcastChannel with the phone app and updates live.
const NURSE_URL = (process.env.NURSE_URL ?? "http://localhost:3100").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Keep production builds from replacing the running development server’s files.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async redirects() {
    // /staff was the first copy of the board inside this app; the nurse app at /nurse replaced it.
    return [{ source: "/staff", destination: "/nurse", permanent: false }];
  },
  async rewrites() {
    return [
      { source: "/nurse", destination: `${NURSE_URL}/nurse` },
      { source: "/nurse/:path*", destination: `${NURSE_URL}/nurse/:path*` },
    ];
  },
};

export default nextConfig;
