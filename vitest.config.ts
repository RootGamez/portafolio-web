import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Configuracion de test separada de vite.config.ts a proposito: el build de
 * produccion no tiene por que cargar el plugin de Tailwind ni resolver jsdom.
 *
 * Alcance deliberado (ver el plan de rediseno): se cubre la LOGICA, no el
 * aspecto. Los hooks de scroll y de video son donde de verdad hay bugs;
 * un snapshot de un componente visual se rompe en cada ajuste de diseno y
 * no demuestra nada.
 */
export default defineConfig({
  /*
   * El cast no es pereza: el proyecto corre Vite 8 (rolldown) y vitest 3
   * arrastra su propio Vite 7 (rollup) anidado en node_modules. Los tipos
   * `Plugin` de ambos son estructuralmente incompatibles (`hotUpdate` cuelga
   * de PluginContext distintos), aunque en ejecucion el plugin de React
   * funciona con las dos. Cuando vitest soporte Vite 8 de forma nativa, esto
   * se cae solo y el cast se puede quitar.
   */
  plugins: [react()] as unknown as never,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    // Mismo motivo que en vite.config.ts: una sola copia de React.
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/hooks/**", "src/components/ProjectCard.tsx"],
    },
  },
});
