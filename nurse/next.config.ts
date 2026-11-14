import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served under /nurse so the main web app can forward /nurse/* here.
  // Same origin means the board shares localStorage and BroadcastChannel with the phone app.
  basePath: "/nurse",
  // Keep production builds from replacing the running development server’s files.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
