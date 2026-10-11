import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://23d3-111-119-187-32.ngrok-free.app",
        changeOrigin: true,
        secure: false,
        headers: { "ngrok-skip-browser-warning": "true" },
      },
      "/media": {
        target: "https://23d3-111-119-187-32.ngrok-free.app",
        changeOrigin: true,
        secure: false,
        headers: { "ngrok-skip-browser-warning": "true" },
      },
      "/assets": {
        target: "https://23d3-111-119-187-32.ngrok-free.app",
        changeOrigin: true,
        secure: false,
        headers: { "ngrok-skip-browser-warning": "true" },
      },
    },
  },
});
