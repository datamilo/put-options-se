import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(async ({ mode }) => {
  let componentTaggerPlugin: any = null;
  if (mode === 'development') {
    try {
      const mod = await import('lovable-tagger');
      componentTaggerPlugin = mod.componentTagger();
    } catch {
      componentTaggerPlugin = null;
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      componentTaggerPlugin,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: '/',
  };
});
