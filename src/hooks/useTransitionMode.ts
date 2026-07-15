import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * `book`  — pantalla ancha en horizontal: libro abierto a doble pagina con
 *           giro de hoja real sobre el lomo.
 * `slide` — movil / tablet en vertical: una pagina a la vez con deslizamiento
 *           horizontal (el flip 3D con perspectiva + sombras duras se sale del
 *           presupuesto de 16ms/frame en GPU movil).
 * `fade`  — el usuario pidio menos movimiento: intercambio casi instantaneo.
 */
export type TransitionMode = "book" | "slide" | "fade";

const BOOK_QUERY = "(min-width: 1024px) and (orientation: landscape)";

export function useTransitionMode(): TransitionMode {
  const reduced = usePrefersReducedMotion();
  const [isWide, setIsWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(BOOK_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(BOOK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsWide(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduced) return "fade";
  return isWide ? "book" : "slide";
}
