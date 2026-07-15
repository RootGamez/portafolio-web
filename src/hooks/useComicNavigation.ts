import { useCallback, useEffect, useState } from "react";

/**
 * Navegacion por hash sobre una unica URL canonica.
 *
 * Por que hash y no rutas reales: las paginas estan SIEMPRE montadas en el
 * DOM (requisito de indexacion). Con rutas reales, todas las URLs servirian
 * un HTML identico -> contenido duplicado. Una sola URL canonica + hash da
 * deep-linking y back/forward del navegador sin ese problema.
 *
 * El teclado y el paso de pagina viven en ComicBook: ahi se sabe si el modo
 * es libro (avanza de pliego en pliego) o pagina suelta.
 */
export function useComicNavigation(slugs: readonly string[]) {
  const indexFromHash = useCallback((): number => {
    const slug = window.location.hash.replace(/^#\/?/, "");
    const found = slugs.indexOf(slug);
    return found === -1 ? 0 : found;
  }, [slugs]);

  const [index, setIndex] = useState(indexFromHash);

  useEffect(() => {
    const onHashChange = () => setIndex(indexFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [indexFromHash]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slugs.length - 1, next));
      const target = `#/${slugs[clamped]}`;
      setIndex(clamped);
      if (window.location.hash !== target) {
        window.history.pushState(null, "", target);
      }
    },
    [slugs],
  );

  return { index, goTo, total: slugs.length };
}
