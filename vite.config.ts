import { defineConfig } from "vite";

export default defineConfig({
  base: "/criador-consciente/",
  build: {
    outDir: "dist/criador-consciente",
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
