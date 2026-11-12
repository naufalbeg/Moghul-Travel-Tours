import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/security-headers";

const nextConfig: NextConfig = {
  // Fixed security headers on every response. The Content-Security-Policy is
  // set per request in proxy.ts, because it carries a one-time nonce.
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    // Serve photos as-is instead of through Vercel's image optimizer: the
    // Hobby plan's monthly optimization quota ran out and Vercel then answers
    // every image with 402. Uploads are already cropped and resized in the
    // browser (lib/storage-config.ts), so the optimizer added little.
    unoptimized: true,
    // Package and gallery photos are served from Supabase Storage.
    remotePatterns: [
      new URL("https://bgomzagmktakkqmkiqdn.supabase.co/storage/v1/object/public/**"),
    ],
  },
};

export default nextConfig;
