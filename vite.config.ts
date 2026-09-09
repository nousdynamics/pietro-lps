import { defineConfig } from "vite";

export default defineConfig({
  base: "/criadores-conscientes/",
  build: {
    outDir: "dist/criadores-conscientes",
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "index.html",
        aberta: "aberta/index.html",
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
});
