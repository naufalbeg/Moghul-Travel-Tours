import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Package and gallery photos are served from Supabase Storage.
    remotePatterns: [
      new URL("https://bgomzagmktakkqmkiqdn.supabase.co/storage/v1/object/public/**"),
    ],
  },
};

export default nextConfig;
