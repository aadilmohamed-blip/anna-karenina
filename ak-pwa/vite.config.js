import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Builds an installable, fully-offline PWA. The service worker precaches the
// app shell and all assets, so after the first load it runs with no network.
export default defineConfig({
  // relative base so it works from any folder / static host, including file-like hosting
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      workbox: {
        // precache everything the build emits
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
      manifest: {
        name: "Anna Karenina — Reading Companion",
        short_name: "AK Companion",
        description: "Spoiler-safe character map, timeline, and notes for Anna Karenina (Maude).",
        theme_color: "#10171c",
        background_color: "#10171c",
        display: "standalone",
        orientation: "any",
        start_url: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
