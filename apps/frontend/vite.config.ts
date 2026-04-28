import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      '/api/fournisseurs': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
      '/fournisseurs': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
});
