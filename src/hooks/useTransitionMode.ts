import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * `flip3d` — desktop con puntero fino: giro 3D real de la hoja.
 * `slide`  — tactil/movil: el flip 3D con perspectiva + sombras duras se sale
 *            del presupuesto de 16ms/frame en GPU movil. Un track horizontal
 *            con swipe es ademas como se leen comics en el movil.
 * `fade`   — el usuario pidio menos movimiento: crossfade corto, sin 3D.
 */
export type TransitionMode = "flip3d" | "slide" | "fade";

const DESKTOP_QUERY = "(min-width: 1024px) and (pointer: fine)";

export function useTransitionMode(): TransitionMode {
  const reduced = usePrefersReducedMotion();
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduced) return "fade";
  return isDesktop ? "flip3d" : "slide";
}
