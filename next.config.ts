import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images from Runway CDN and other sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.runwayml.com' },
      { protocol: 'https', hostname: '*.runway.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.googleapis.com' },
    ],
  },
  // Ensure Runway SDK and media binaries run server-side only
  serverExternalPackages: ['@runwayml/sdk', 'ffmpeg-static', 'ffprobe-static'],
};

export default nextConfig;
