import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    // Enable cloudflare plugin for production builds
    process.env.NODE_ENV === 'production' ? cloudflare() : undefined
  ].filter(Boolean),
  server: {
    port: 5173,
    host: true
  }
});
