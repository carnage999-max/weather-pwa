// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/app-build-manifest\.json$/],
  runtimeCaching: [
    // Geocode (reverse lookup) - network first is OK for fresh address data
    {
      urlPattern: /^https:\/\/geocode\.maps\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "geocode-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
      },
    },

    // Weather API - use stale-while-revalidate for fast UX + background refresh
    {
      urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "weather-api-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 30 }, // keep entries ~30m
      },
    },

    // Static images and icons
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  experimental: {
    appDir: true,
  }
});
