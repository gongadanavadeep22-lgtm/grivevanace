/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix chunk loading when project path contains spaces (e.g. "dev dynamics")
  // If you see a blank white page, try: 1) Hard refresh (Ctrl+Shift+R) 2) Clear .next and restart
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.output = config.output || {};
      config.output.publicPath = "/_next/";
    }
    return config;
  },
};

module.exports = nextConfig;
