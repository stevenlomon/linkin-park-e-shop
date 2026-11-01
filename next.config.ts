import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // remotePatterns talar om för `next/image` vilka externa URLs som är säkra
    remotePatterns: [
      {
        protocol: 'https', // Bara https, inte http
        hostname: 'iagvygqdqtgbryktkwrw.supabase.co',
        pathname: '/storage/v1/object/public/**', // Endast filer från vår public storage bucket
      },
    ],
  },
};

export default nextConfig;
