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
        name: "jasmin and nada help",
        short_name: "jasmin and nada help",
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
            // Cache all public assets and imported images (Coloring, Stickers, Exercises)
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v2',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache Quran JSON texts (API responses)
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'quran-text-cache-v1',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache Quran MP3 audio streams
            urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio-cache-v1',
              expiration: {
                maxEntries: 7000,
                maxAgeSeconds: 60 * 60 * 24 * 180,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache other audio files (exercises, etc.)
            urlPattern: /\.(?:mp3|wav|ogg|m4a)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache JSON data files
            urlPattern: /\.(?:json)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'json-cache-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Exclude AI/Video conversion tools from caching (they require network or WASM)
            urlPattern: /\/tools\/(?:ai|video|format-converter)/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'tools-excluded',
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache' },
          },
          {
            // Google Fonts static files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
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
