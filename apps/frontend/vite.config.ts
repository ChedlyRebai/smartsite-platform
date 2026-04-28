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
      '/api/materials': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/chat': {
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
      '/api/material-flow': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/consumption': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/site-consumption': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/fournisseurs': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fournisseurs/, '/api/materials/suppliers')
      },
      '/api/fournisseurs': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fournisseurs/, '/api/materials/suppliers')
      },
      '/api/sites': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sites/, '/api/materials/sites')
      },
      '/gestion-sites': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/gestion-sites': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },

  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
});
