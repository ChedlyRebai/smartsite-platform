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
<<<<<<< HEAD
    proxy: {
      '/api/materials': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/site-materials': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/fournisseurs': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
      '/fournisseurs': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
      '/gestion-sites': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/gestion-sites': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3007',
        changeOrigin: true,
      },
    },
=======
>>>>>>> origin/main
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
});
