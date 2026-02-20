import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(async ({ mode }) => {
  const isProduction = mode === 'production';

  // For GitHub Pages, we need to set the base path to match the repository name
  // Check if we're building for GitHub Pages deployment
  const basePath = isProduction ? '/put-options-se' : '/';
  
  return {
    server: {
  host: "::",
  port: 8080,
  watch: {
    usePolling: true,
    interval: 100
    }
  },
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: basePath,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            charts: ['recharts'],
            csv: ['papaparse']
          }
        }
      }
    },
    publicDir: 'public',
    assetsInclude: ['**/*.csv']
  };
});