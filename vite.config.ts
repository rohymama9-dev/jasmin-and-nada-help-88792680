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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB for JS bundles
        globPatterns: ['**/*.{js,css,html,ico,woff,woff2,ttf,eot,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v3',
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 365 * 10, // 10 years
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-text-cache-v1',
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 365 * 10, // 10 years
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio-cache-v1',
              expiration: {
                maxEntries: 1200,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/(?:cdn\.jsdelivr\.net|tessdata\.projectnaptha\.com)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ocr-assets-cache-v1',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache' },
          },
          {
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
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/quran/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-shell-cache-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
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
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
});
