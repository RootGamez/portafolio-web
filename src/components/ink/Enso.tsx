import { motion } from "motion/react";
import { ScrubDraw } from "@/components/motion/ScrubDraw";
import { useStage } from "@/components/stage/StageContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useStageInView } from "@/hooks/useStageInView";
import { EASE_INK } from "@/lib/motion";
import type { ScrubRange } from "@/lib/stage/scrub";

/** El trazo del enso: un circulo de un solo gesto que casi se cierra. */
const ENSO_PATH = "M50 6 A44 44 0 1 1 49 6";

/**
 * El anillo de tinta que se dibuja con el scroll: un arco de 220° que va por la
 * IZQUIERDA del sol (de arriba a la derecha, por la izquierda, hasta abajo a la
 * derecha). En el Hero el retrato tapa la mitad derecha del disco: un circulo
 * completo en sentido horario se dibujaba casi entero detras de la foto (visto
 * en vivo). Asi el gesto recorre la parte que se ve.
 */
const ENSO_RING_PATH = "M65.05 8.65 A44 44 0 1 0 65.05 91.35";

/** Grosor del anillo de tinta, en unidades del viewBox (100). */
const ENSO_RING_WIDTH = 4;

type Props = {
  /** Color de relleno del disco. Por defecto el oro de los posters. */
  readonly fill?: string;
  readonly className?: string;
  /** Si es true dibuja solo el trazo del circulo, sin disco relleno. */
  readonly outline?: boolean;
  /**
   * Tramo de la intro en el que un anillo de tinta se dibuja sobre el disco con
   * el scroll (Fase 4). Solo en el modo escenarios: en el lineal el sitio
   * clasico no lo lleva.
   */
  readonly ring?: ScrubRange;
};

/**
 * El enso (円相): el circulo de un solo trazo. En los posters de referencia
 * es el disco de oro que hace de sol detras de la figura.
 *
 * Decorativo -> aria-hidden. Se dibuja una vez al entrar en viewport con su
 * escenario activo (useStageInView). El observer va en el <svg> raiz y no en
 * la forma: asi vale igual para el disco que para el trazo.
 */
export function Enso({
  fill = "var(--kin-500)",
  className = "",
  outline = false,
  ring,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const { mode } = useStage();
  const { ref, shown } = useStageInView<SVGSVGElement>(0.4);
  const drawn = reduced || shown;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      className={className}
    >
      {!outline && (
        <motion.circle
          cx="50"
          cy="50"
          r="46"
          fill={fill}
          initial={reduced ? false : { scale: 0.82, opacity: 0 }}
          animate={
            drawn ? { scale: 1, opacity: 1 } : { scale: 0.82, opacity: 0 }
          }
          transition={{ duration: 0.7, ease: EASE_INK }}
          style={{ transformOrigin: "50% 50%" }}
        />
      )}
      {outline && (
        <motion.path
          d={ENSO_PATH}
          fill="none"
          stroke={fill}
          strokeWidth="7"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: drawn ? 1 : 0 }}
          transition={{ duration: 0.9, ease: EASE_INK }}
        />
      )}
      {ring && mode === "deck" && (
        <g data-enso-ring="">
          <ScrubDraw
            range={ring}
            d={ENSO_RING_PATH}
            fill="none"
            stroke="var(--g-heading)"
            strokeWidth={ENSO_RING_WIDTH}
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
