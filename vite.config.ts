import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // --- Simple Analytics Plugin ---
    {
      name: "simpleanalytics",
      transformIndexHtml(html) {
        const file = mode === "development" ? "latest.dev.js" : "latest.js";
        return {
          html,
          tags: [
            {
              tag: "script",
              attrs: {
                async: true,
                src: `https://scripts.simpleanalyticscdn.com/${file}`,
              },
              injectTo: "head",
            },
          ],
        };
      },
    },
    // --- Progressive Web App (PWA) Plugin ---
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png"],
      manifest: {
        name: "VibeSync - Music Player",
        short_name: "VibeSync",
        description: "A beautiful, offline-first PWA music player",
        theme_color: "#8B5CF6",
        background_color: "#0F0F14",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(mp3|wav|ogg)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));