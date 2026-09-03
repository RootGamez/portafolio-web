import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { EASE_INK } from "@/lib/motion";

type Props = {
  /** Path SVG del trazo. Se dibuja en un viewBox de 100x12 salvo que se diga otro. */
  readonly d?: string;
  readonly viewBox?: string;
  readonly className?: string;
  readonly strokeWidth?: number;
  readonly delay?: number;
};

/** Trazo de pincel por defecto: ligeramente irregular, como un subrayado a mano. */
const DEFAULT_D = "M2 8 C 18 3, 34 10, 52 6 S 84 3, 98 7";

/**
 * El gesto firma del sitio: un trazo que se DIBUJA, no que aparece.
 * `pathLength` de Motion normaliza la longitud a 0..1, asi que el mismo
 * componente sirve para cualquier path sin recalcular stroke-dasharray.
 *
 * CRITICO — con prefers-reduced-motion el trazo se renderiza COMPLETO y
 * estatico. No se anima y, sobre todo, no arranca invisible: un initial de
 * pathLength 0 con la animacion desactivada dejaria el trazo sin dibujar
 * para siempre. Ver docs/DESIGN_SYSTEM.md §7, restriccion 2.
 */
export function BrushStroke({
  d = DEFAULT_D,
  viewBox = "0 0 100 12",
  className = "",
  strokeWidth = 4,
  delay = 0,
}: Props) {
  const reduced = usePrefersReducedMotion();

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={className}
    >
      <motion.path
        d={d}
        className="brush-path"
        strokeWidth={strokeWidth}
        initial={reduced ? false : { pathLength: 0 }}
        whileInView={reduced ? undefined : { pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: EASE_INK, delay }}
      />
    </svg>
  );
}
