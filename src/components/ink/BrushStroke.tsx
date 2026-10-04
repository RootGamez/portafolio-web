import { motion } from "motion/react";
import { ScrubDraw } from "@/components/motion/ScrubDraw";
import { useStage } from "@/components/stage/StageContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useStageInView } from "@/hooks/useStageInView";
import { EASE_INK } from "@/lib/motion";
import type { ScrubOver, ScrubRange } from "@/lib/stage/scrub";

type Props = {
  /** Path SVG del trazo. Se dibuja en un viewBox de 100x12 salvo que se diga otro. */
  readonly d?: string;
  readonly viewBox?: string;
  readonly className?: string;
  readonly strokeWidth?: number;
  readonly delay?: number;
  /**
   * En el modo escenarios, dibujarlo con el SCROLL (`ScrubDraw`) en vez de por
   * tiempo al entrar en vista. En modo lineal se ignora: el trazo de siempre.
   */
  readonly scrub?: { readonly range: ScrubRange; readonly over?: ScrubOver };
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
  scrub,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const { mode } = useStage();
  // Se dibuja al entrar en vista Y con su escenario activo (ver useStageInView).
  const { ref, shown } = useStageInView<SVGPathElement>(0.6);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={className}
    >
      {scrub && mode === "deck" ? (
        <ScrubDraw
          range={scrub.range}
          over={scrub.over}
          d={d}
          className="brush-path"
          strokeWidth={strokeWidth}
        />
      ) : (
        <motion.path
          ref={ref}
          d={d}
          className="brush-path"
          strokeWidth={strokeWidth}
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: reduced || shown ? 1 : 0 }}
          transition={{ duration: 0.6, ease: EASE_INK, delay }}
        />
      )}
    </svg>
  );
}
