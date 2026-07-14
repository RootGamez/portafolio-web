import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    // La media de public/media ya viene optimizada (WebM/AVIF); no se re-procesa.
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ["motion"],
          gsap: ["gsap"],
        },
      },
    },
  },
});
