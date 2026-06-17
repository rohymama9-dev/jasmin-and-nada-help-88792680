import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite(),
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp', '**/*.svg'],
      manifest: {
        name: "jn help",
        short_name: "jn help",
        description: "تطبيق تفاعلي للصحة والتعليم والترفيه",
        theme_color: "#f5c6d0",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          }
        ]
      },
      workbox: {
        // Only precache the app shell (JS/CSS/HTML) — images handled by runtime cache
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB for JS bundles
        globPatterns: ['**/*.{js,css,html,ico,woff,woff2,ttf,eot}'],
        // Runtime caching for images — works for ALL sizes including large coloring images
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v1',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
      }
    })
  ],
  server: {
    host: "::",
    port: 8080,
  },
});
