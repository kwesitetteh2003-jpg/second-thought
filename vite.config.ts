import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Web on 9011, API on 9010 (ports 9000-9099 reserved for this project on the build box).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 9011, host: "127.0.0.1", proxy: { "/api": { target: "http://127.0.0.1:9010", changeOrigin: true } } },
  preview: { port: 9012, host: "127.0.0.1" },
  build: { chunkSizeWarningLimit: 900 },
});
