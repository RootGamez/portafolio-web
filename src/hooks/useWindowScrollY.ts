import { useEffect, useState } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

/**
 * Posicion vertical del scroll de la ventana, como MotionValue.
 *
 * Es la unica entrada de scroll del modo escenarios. Se escribio a mano en vez
 * de usar `useScroll` de Motion porque aqui solo hace falta el px crudo, no un
 * progreso respecto a un elemento, y asi:
 *   - arranca ya con `window.scrollY` (no con 0): al recargar a mitad de pagina
 *     el primer pintado sale en el escenario correcto, sin un frame erroneo;
 *   - se prueba con eventos `scroll` reales, sin mockear Motion;
 *   - el listener es PASIVO: nunca puede bloquear el scroll (salvaguarda 1).
 *
 * Los navegadores entregan el evento `scroll` como mucho una vez por frame, asi
 * que no hace falta throttling propio. Escribir en un MotionValue no provoca
 * render de React: lo consumen `useTransform` y los estilos de Motion.
 */
export function useWindowScrollY(): MotionValue<number> {
  // Valor inicial perezoso: leer `window.scrollY` en cada render podria forzar
  // layout; `useMotionValue` evalua su argumento siempre, asi que se lee una vez.
  const [initial] = useState(() => (typeof window === "undefined" ? 0 : window.scrollY));
  const scrollY = useMotionValue(initial);

  useEffect(() => {
    const update = () => scrollY.set(window.scrollY);

    // Pudo cambiar entre el primer render y el montaje (restauracion del scroll).
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [scrollY]);

  return scrollY;
}
