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
    /*
     * Fuerza una unica copia de React aunque una dependencia lo resuelva por
     * otra ruta real (enlaces simbolicos, restos de otro gestor de paquetes).
     * Sin esto, `motion` puede cargar su propio React: sus hooks se ejecutan
     * contra un dispatcher distinto al que renderiza y todo revienta con
     * "Invalid hook call", que no dice nada de la causa real.
     */
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    // La media de public/media ya viene optimizada (MP4/AVIF); no se re-procesa.
    assetsInlineLimit: 4096,
  },
});
