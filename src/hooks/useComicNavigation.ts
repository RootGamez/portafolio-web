import { useCallback, useEffect, useState } from "react";

/**
 * Navegacion por hash sobre una unica URL canonica.
 *
 * Por que hash y no rutas reales: las 7 paginas estan SIEMPRE montadas en el
 * DOM (requisito de indexacion). Con rutas reales, las 7 URLs servirian un HTML
 * identico -> contenido duplicado. Una sola URL canonica + hash da deep-linking
 * y back/forward del navegador sin ese problema.
 */
export function useComicNavigation(slugs: readonly string[]) {
  const indexFromHash = useCallback((): number => {
    const slug = window.location.hash.replace(/^#\/?/, "");
    const found = slugs.indexOf(slug);
    return found === -1 ? 0 : found;
  }, [slugs]);

  const [index, setIndex] = useState(indexFromHash);
  // -1 = retrocediendo, 1 = avanzando. Decide la direccion del giro.
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const onHashChange = () => {
      const next = indexFromHash();
      setIndex((current) => {
        setDirection(next >= current ? 1 : -1);
        return next;
      });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [indexFromHash]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slugs.length - 1, next));
      setIndex((current) => {
        if (clamped === current) return current;
        setDirection(clamped > current ? 1 : -1);
        return clamped;
      });
      window.history.pushState(null, "", `#/${slugs[clamped]}`);
    },
    [slugs],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Teclado: flechas y AvPag/RePag pasan pagina.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // No secuestrar el teclado dentro de campos de formulario.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  return {
    index,
    direction,
    goTo,
    next,
    prev,
    isFirst: index === 0,
    isLast: index === slugs.length - 1,
    total: slugs.length,
  };
}
