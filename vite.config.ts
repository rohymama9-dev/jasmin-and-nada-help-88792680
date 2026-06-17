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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
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
      }
    })
  ],
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/news': {
        target: 'https://gnews.io/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '')
      }
    }
  },
});
