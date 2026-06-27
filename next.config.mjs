/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Initialize the PWA builder with optimized mobile configurations
const withPWA = withPWAInit({
  dest: "public",                      // Where the compiled service worker files (sw.js) will be saved
  register: true,                      // Automatically injects the service worker registration script into HTML headers
  skipWaiting: true,                   // Forces the new service worker to take control immediately when an update is found
  disable: false, // PWA explicitly enabled as requested
});

// 2. Define your base Next.js configuration options
const nextConfig = {
  /* Core configuration options go here */
  reactCompiler: true, // Enables the experimental React Compiler for automatic performance optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
};

// 3. Export the combined configuration, wrapping your nextConfig with PWA capabilities
export default withPWA(nextConfig);
