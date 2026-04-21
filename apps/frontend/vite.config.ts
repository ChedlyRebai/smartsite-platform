import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
  },
  // Dev : optionnel — si vous appelez des URLs relatives `/api/...`, elles sont proxifiées vers l’API locale (même port que VITE_AUTH_API_URL / PORT Nest).
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://192.168.39.69:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")},
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
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
