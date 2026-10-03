import { useEffect, useState } from "react";

/**
 * Valor vivo de una media query. El estado inicial se lee SINCRONO en el primer
 * render (no hay SSR: el HTML de partida esta vacio), asi el primer pintado ya
 * sale con el valor correcto y no hay parpadeo entre modos.
 *
 * Es la misma idea que usePrefersReducedMotion, generalizada. Aquella se queda
 * como esta: tiene tests y la usan once componentes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Pudo cambiar entre el render y el efecto, o al cambiar `query`.
    setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
